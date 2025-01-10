from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
import pdf2image
import os
import pickle  # For saving and loading knowledge base
import shutil  # For file handling
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from sklearn.neighbors import NearestNeighbors
import numpy as np
from langchain_community.llms import OpenAI
from langchain.chains.question_answering import load_qa_chain
from langchain.schema import Document
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Initialize FastAPI app

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains to make requests, can replace '' with specific domains
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods like GET, POST, PUT, DELETE
    allow_headers=["*"],  # Allows all headers in requests
)

# Knowledge base storage
knowledge_base_path = "knowledge_base.pkl"

# Function to load the knowledge base from a file
def load_knowledge_base():
    if os.path.exists(knowledge_base_path):
        with open(knowledge_base_path, "rb") as kb_file:
            return pickle.load(kb_file)
    return []

# Function to save the knowledge base to a file
def save_knowledge_base(knowledge_base):
    with open(knowledge_base_path, "wb") as kb_file:
        pickle.dump(knowledge_base, kb_file)

# Function to clear temporary files
def cleanup_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error while cleaning up file: {file_path}. Details: {e}")

# Function to extract text using OCR from an image
def ocr_from_image(image_path):
    image = Image.open(image_path)
    return pytesseract.image_to_string(image)

# API 1: Upload and process a PDF
@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    try:
        # Save the uploaded file temporarily
        with open(temp_file_path, "wb") as temp_file:
            shutil.copyfileobj(file.file, temp_file)

        # Read the PDF file
        pdf_reader = PdfReader(temp_file_path)
        text = "".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())

        # If text extraction fails, use OCR on image parts
        if not text.strip():
            # Use pdf2image to convert PDF pages to images and apply OCR
            images = pdf2image.convert_from_path(temp_file_path)
            ocr_text = ""
            for image in images:
                ocr_text += ocr_from_image(image)

            # Combine OCR text with regular text extraction (if OCR found something)
            text += "\n" + ocr_text

        if not text.strip():
            raise HTTPException(status_code=400, detail="The uploaded PDF contains no readable text.")

        # Split text into chunks
        text_splitter = CharacterTextSplitter(separator="\n", chunk_size=1000, chunk_overlap=200, length_function=len)
        chunks = text_splitter.split_text(text)

        # Generate embeddings
        embeddings = OpenAIEmbeddings()
        chunk_embeddings = embeddings.embed_documents(chunks)

        # Create and save the knowledge base
        knowledge_base = [{"text": chunk, "embedding": emb} for chunk, emb in zip(chunks, chunk_embeddings)]
        save_knowledge_base(knowledge_base)

        # Cleanup the temporary file
        cleanup_file(temp_file_path)

        return {"message": "PDF uploaded and processed successfully!", "chunks": len(chunks)}

    except Exception as e:
        cleanup_file(temp_file_path)  # Ensure cleanup even in case of errors
        raise HTTPException(status_code=500, detail=str(e))


# API 2: Query the knowledge base
class QueryRequest(BaseModel):
    question: str

@app.post("/ask/")  # Query the knowledge base
async def ask_question(request: QueryRequest):
    try:
        question = request.question

        # Load the knowledge base
        knowledge_base = load_knowledge_base()
        if not knowledge_base:
            raise HTTPException(status_code=500, detail="Knowledge base is empty. Upload a PDF first.")

        # Search for relevant documents
        embeddings = OpenAIEmbeddings()
        query_embedding = embeddings.embed_query(question)
        query_embedding = np.array(query_embedding).reshape(1, -1)
        neigh = NearestNeighbors(n_neighbors=min(3, len(knowledge_base)), metric="cosine")
        neigh.fit([kb["embedding"] for kb in knowledge_base])
        distances, indices = neigh.kneighbors(query_embedding)
        docs = [Document(page_content=knowledge_base[i]["text"]) for i in indices[0]]

        min_distance = distances[0][0]  # Assuming that `distances` is an array of shape (1, n_neighbors)

        # Define relevance thresholds
        relevance_threshold = 0.3
        partial_relevance_threshold = 0.5

        if min_distance < relevance_threshold:
            # Use OpenAI to get supplemental information
            llm = OpenAI()
            chain = load_qa_chain(llm, chain_type="stuff")
            pdf_response = chain.run(input_documents=docs, question=question)
            external_response = llm(f"Provide additional information about: {question}")
            return {
                "pdf_response": pdf_response,
                "supplemental_response": external_response,
            }

        elif min_distance < partial_relevance_threshold:
            # Use OpenAI to fetch additional context
            llm = OpenAI()
            chain = load_qa_chain(llm, chain_type="stuff")
            pdf_response = chain.run(input_documents=docs, question=question)
            external_response = llm(f"Provide additional information about: {question}")
            return {
                "partial_pdf_response": pdf_response,
                "supplemental_response": external_response
            }

        else:
            return {
                "message": "The topic is not covered in the PDF, and no additional information was fetched."
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
