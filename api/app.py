from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
import pdf2image
import os
import shutil  # For file handling
import numpy as np
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from sklearn.neighbors import NearestNeighbors
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
    allow_headers=["*"],  # Allows all headers in requests
)

# Folder path to upload files
UPLOAD_FOLDER = "uploads"

# Function to clean up temporary files
def cleanup_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error while cleaning up file: {file_path}. Details: {e}")

# Function to extract text from PDF using PyPDF2 and OCR if necessary
def extract_text_from_pdf(pdf_path):
    try:
        # Try reading PDF normally using PyPDF2
        pdf_reader = PdfReader(pdf_path)
        text = "".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())

        # If no text is extracted, use OCR
        if not text.strip():
            images = pdf2image.convert_from_path(pdf_path)
            ocr_text = ""
            for image in images:
                ocr_text += pytesseract.image_to_string(image)
            text += "\n" + ocr_text

        return text

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# API 1: Upload a PDF (Optional)
@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Save uploaded file to the uploads folder
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as temp_file:
            shutil.copyfileobj(file.file, temp_file)

        return {"message": f"File {file.filename} uploaded successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API 2: Query the PDFs in the folder
class QueryRequest(BaseModel):
    question: str

@app.post("/ask/")  # Query the PDFs in the folder
async def ask_question(request: QueryRequest):
    try:
        question = request.question

        # List all PDF files in the upload folder
        pdf_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".pdf")]
        if not pdf_files:
            raise HTTPException(status_code=500, detail="No PDF files found in the upload folder.")

        # Extract text from all PDF files
        all_text = ""
        for pdf_file in pdf_files:
            pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file)
            text = extract_text_from_pdf(pdf_path)
            all_text += text + "\n"

        # Split the extracted text into chunks
        text_splitter = CharacterTextSplitter(separator="\n", chunk_size=1000, chunk_overlap=200, length_function=len)
        chunks = text_splitter.split_text(all_text)

        # Generate embeddings for each chunk
        embeddings = OpenAIEmbeddings()
        chunk_embeddings = embeddings.embed_documents(chunks)

        # Use NearestNeighbors to find the most relevant chunks based on the user's query
        query_embedding = embeddings.embed_query(question)
        query_embedding = np.array(query_embedding).reshape(1, -1)
        neigh = NearestNeighbors(n_neighbors=3, metric="cosine")
        neigh.fit(chunk_embeddings)
        distances, indices = neigh.kneighbors(query_embedding)
        docs = [Document(page_content=chunks[i]) for i in indices[0]]

        # Check relevance of the closest documents
        min_distance = distances[0][0]
        relevance_threshold = 0.3
        partial_relevance_threshold = 0.5
        if min_distance < relevance_threshold:
            # Use OpenAI to answer the question based on relevant documents
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
