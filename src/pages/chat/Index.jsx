import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, message, Divider, Upload, Spin } from 'antd';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MessageText from '../../components/MessageText';
import dayjs from 'dayjs';  // Import dayjs
import Prompt from './prompts/prompt';
import Topic from './prompts/Topic';
import { Bot, ChevronsLeftRightEllipsis, PictureInPicture2, Plane, Plus, Rotate3D, SendHorizonal } from 'lucide-react';

const Index = () => {
  const [tabs, setTabs] = useState(['New Session']); // Store subject names (tabs)
  const [messages, setMessages] = useState({}); // Store messages per subject
  const [activeTab, setActiveTab] = useState('New Session'); // Track the active tab
  const [imageUrl, setImageUrl] = useState();
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [uploadLoading, setUploadLoading] = useState(false); // Track loading state
  const [content, setContent] = useState(""); // Track loading state
  const messagesEndRef = useRef(null);
  const tabInputRef = useRef(null);

  const GEMINI_API_KEY = 'AIzaSyC_7ryXaKSuQ7kD2axZl_EYkwLoEv_0q9c'; // Replace with your Gemini API key

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const handleSendMessage = async (subject, question) => {
    if (!question) return;
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setMessages((prev) => ({
      ...prev,
      [subject]: [...(prev[subject] || []), { from: 'user', message: question, timestamp }],
    }));
    setIsLoading(true);

    try {

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: `Instruction: ${Prompt()}` }] },
          { role: 'user', parts: [{ text: ` ${content && "Content: " + content}` }] },
          { role: 'user', parts: [{ text: `Question: ${question}` }] },
        ]
      });

      const result = await chat.sendMessageStream(question, {
        model: 'gemini-1.5-flash',
        key: GEMINI_API_KEY,
      });

      let fullResponse = '';
      setMessages((prev) => ({
        ...prev,
        [subject]: [...(prev[subject] || []), { from: 'user', message: question, timestamp }],
      }));
      for await (const chunk of result.stream) {
        fullResponse += chunk.text();
        setMessages((prev) => ({
          ...prev,
          [subject]: [
            ...prev[subject].slice(0, -1),
            { from: 'bot', message: fullResponse, timestamp },
          ],
        }));
      }

      setIsLoading(false);
    } catch (error) {
      message.error('Error sending message to Gemini API: ' + error.message);
      setIsLoading(false);
    }
  };
  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };
  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      setUploadLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (url) => {
        // setLoading(false);
        setImageUrl(url);
      });
    }
  };
  useEffect(() => {
    setMessages({});
  }, [activeTab]);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const addTab = () => {
    const tabName = tabInputRef.current.input.value;
    if (!tabName) return;

    setTabs((prev) => [...prev, tabName]);
    setActiveTab(tabName);
    tabInputRef.current.input.value = '';
  };

  useEffect(() => {
    setMessages({});
  }, [activeTab]);

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: 'none',
      }}
      type="button"
    >
      {uploadLoading ? <Spin /> : <Plus />}
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );
  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-[#BDE8CAa1] p-4 pr-0">
        <div className="mb-3 bg-white p-3 rounded-lg shadow-sm">
          <div className="text-2xl font-bold mb-6">Contena.Ai</div>
          <div className="font-medium text-md mb-3">Create Session</div>
          <div className='flex items-center'>
            <Input
              ref={tabInputRef}
              placeholder="Enter Title"
              size="large"
            />
            <Button
              size="large"
              type="primary"
              className="ml-2 shadow-none"
              onClick={addTab}
              loading={isLoading}
            >
              Create
            </Button>
          </div>
          <Divider />
          <div className="font-medium text-lg mb-3">All Sessions</div>
          {tabs.map((tab, index) => (
            <Button
              size="large"
              key={index}
              type={tab === activeTab ? "primary" : "default"}
              className="w-full shadow-none mb-3"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-screen flex-1 grid grid-cols-8 gap-4 bg-[#BDE8CAa1] p-4">
        {activeTab && (
          <>
            <div className="col-span-5 h-full relative flex flex-col bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="justify-between bg-[#0D7C66] items-center p-4  mb-2 ">
                <h3 className="text-xl text-white  flex gap-2 items-center">
                  <Bot /> {activeTab}
                </h3>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 240px)" }}>
                {/* Ensure that the messages scrollable */}
                {messages[activeTab]?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-xs ${msg.from === "user" ? "user-msg" : "bot-msg"
                        }`}
                    >
                      <MessageText content={msg.message} />
                      <div
                        className={`text-xs text-stone-500 font-medium mt-2 ${msg.from === "user"
                          ? "text-right text-white"
                          : "text-left text-stone-500"
                          }`}
                      >
                        {dayjs(msg.timestamp).format("HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center absolute bottom-0 left-0 right-0 m-8 p-1 bg-white border border-stone-300 shadow-sm rounded-full overflow-hidden">
                <Input
                  size="large"
                  placeholder="Ask a question..."
                  className="flex-1 border-none rounded-full pl-5 h-14"
                  onPressEnter={(e) => handleSendMessage(activeTab, e.target.value)}
                />
                <Button
                  size="large"
                  type="primary"
                  className="shadow-none rounded-full w-14 h-14 p-0"
                  onClick={(e) => handleSendMessage(activeTab, e.target.previousElementSibling.value)}
                >
                  <SendHorizonal />
                </Button>
              </div>
            </div>

            <div className="col-span-3 relative shadow-sm bg-white rounded-lg p-6 ">
              <div className='-left-10 top-4 absolute bg-white px-4 py-0.5 rounded-full border border-stone-300'><ChevronsLeftRightEllipsis /></div>
              <div className="grid grid-cols-1  gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Provide Content Here!</h3>
                  <Input.TextArea
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your content..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg shadow-sm p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Documents</h3>
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader border-2 border-dashed border-gray-300 rounded-lg p-4 w-full"
                    action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                    beforeUpload={() => false}
                    multiple
                    onChange={handleChange}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div className="text-center text-gray-500">
                        <PictureInPicture2 />
                        {/* <p className="text-sm"></p> */}
                        {/* <span className="block mt-2 text-gray-400">or drag and drop</span> */}
                      </div>
                    )}
                  </Upload>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>

  );
};

export default Index;