import { useState, useEffect, useRef } from 'react';
import { Input, Button, message, Divider, Upload } from 'antd';
import axios from 'axios'; // Import Axios
import MessageText from '../../components/MessageText';
import dayjs from 'dayjs';
import { Bot, PictureInPicture2, SendHorizonal } from 'lucide-react';
import { BarLoader, ScaleLoader } from 'react-spinners';

const Index = () => {
  const [tabs, setTabs] = useState(['New Session']);
  const [messages, setMessages] = useState({});
  const [activeTab, setActiveTab] = useState('Ai Assistant');
  const [imageUrl, setImageUrl] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const searchBoxRef = useRef(null);
  const tabInputRef = useRef(null);
  const [search, setSearch] = useState(null)
  const [disable, setDisable] = useState(false)
  const handleSendMessage = async (subject, question) => {
    if (!question) return;
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setSearch("");
    setDisable(true);
    setMessages((prev) => ({
      ...prev,
      [subject]: [...(prev[subject] || []), { from: 'user', message: question, timestamp }],
    }));
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/ask', { question: question });
      const reply = response.data.pdf_response || 'No response received.';
      setMessages((prev) => ({
        ...prev,
        [subject]: [
          ...prev[subject],
          { from: 'bot', message: reply, timestamp },
        ],
      }));
    } catch (error) {
      message.error('Error sending message: ' + error.message);
    } finally {
      setDisable(false);
      setIsLoading(false);
    }
  };

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const handleChange = async (info) => {

    // console.log(info)
    if (info.file) {
      const formData = new FormData();
      formData.append('file', info.file); // Attach the file

      try {
        setUploadLoading(true);
        const response = await axios.post('http://localhost:8000/upload-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the content type for file uploads
          },
        });

        message.success('PDF uploaded and processed successfully!');
        console.log('Response:', response.data);
      } catch (error) {
        message.error('Error uploading file: ' + error.message);
      } finally {
        setUploadLoading(false);
      }
    }
  };
  // const handleChange = (info) => {
  //   if (info.file.status === 'uploading') {
  //     setUploadLoading(true);
  //     return;
  //   }
  //   if (info.file.status === 'done') {
  //     getBase64(info.file.originFileObj, (url) => {
  //       setImageUrl(url);
  //     });
  //   }
  // };

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

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-[#BDE8CAa1] p-4 pr-0 hidden">
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
            <div className="col-span-3 relative shadow-sm bg-white rounded-lg p-6 ">
              {/* <div className='-left-10 top-4 absolute bg-white px-4 py-0.5 rounded-full border border-stone-300'><ChevronsLeftRightEllipsis /></div> */}
              <div className='flex items-center gap-3  mb-6'>
                <div className=' text-white text-2xl w-12 h-12 flex items-center justify-center font-medium rounded-full bg-primary font-serif'>Li</div>
                <div>

                  <div className="text-2xl font-bold">Lipedia</div>
                  <div className="text-sm font-medium">The AI-Powered Content Companion.</div>
                </div>
              </div>

              <div className="grid grid-cols-1  gap-6">
                <div className='hidden'>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Provide Content Here!</h3>
                  <Input.TextArea
                    // onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your content..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg shadow-sm p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <h3 className="text-md font-medium  mb-2">Upload Pdf Document</h3>
                  {uploadLoading && (<>
                    <div className='p-3'>Sending file <BarLoader  color='#0D7C66' /></div></>)}
                  {/* <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader border border-dashed border-gray-400 rounded-lg p-4 w-full"
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
                      </div>
                    )}
                  </Upload> */}
                  <Upload
                    name="pdf"
                    listType="picture-card"
                    className="avatar-uploader border border-dashed border-gray-400 rounded-lg p-4 w-full"
                    beforeUpload={() => false} // Prevent automatic upload
                    onChange={handleChange} // Handle file upload manually
                    showUploadList={false} // Hide file list
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="uploaded"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <PictureInPicture2 />

                      </div>
                    )}
                  </Upload>

                </div>
              </div>
            </div>
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

              <div className="flex items-center absolute bottom-0 left-0 right-0 m-8 p-1 bg-white border border-stone-300 shadow-sm rounded-full overflow-hidden focus-within:border-primary/70">
                <Input
                  disabled={disable}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} size="large"
                  placeholder="Ask a question..."
                  className="flex-1 border-none focus:!shadow-none  rounded-full pl-5 h-14"
                  onPressEnter={(e) => handleSendMessage(activeTab, e.target.value)}
                />
                <Button
                  size="large"
                  type="primary"
                  className="shadow-none rounded-full w-14 h-14 p-0"
                  onClick={(e) => handleSendMessage(activeTab, e.target.previousElementSibling.value)}
                >
                  {
                    isLoading ?
                      <ScaleLoader width={2} height={15} color='white' />
                      : <SendHorizonal />
                  }

                </Button>
              </div>
            </div>



          </>
        )}
      </div>
    </div>
    // <div className="flex h-screen">
    //   <div className="w-1/4 bg-[#BDE8CAa1] p-4 pr-0 hidden">
    //     {/* Sidebar content */}
    //   </div>

    //   <div className="h-screen flex-1 grid grid-cols-8 gap-4 bg-[#BDE8CAa1] p-4">
    //     {activeTab && (
    //       <>
    //         <div className="col-span-3 relative shadow-sm bg-white rounded-lg p-6 ">
    //           {/* Sidebar details */}
    //         </div>
    //         <div className="col-span-5 h-full relative flex flex-col bg-white shadow-sm rounded-lg overflow-hidden">
    //           <div className="justify-between bg-[#0D7C66] items-center p-4 mb-2 ">
    //             <h3 className="text-xl text-white flex gap-2 items-center">
    //               <Bot /> {activeTab}
    //             </h3>
    //           </div>

    //           <div className="space-y-4 flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 240px)" }}>
    //             {messages[activeTab]?.map((msg, idx) => (
    //               <div
    //                 key={idx}
    //                 className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
    //               >
    //                 <div
    //                   className={`p-3 rounded-lg max-w-xs ${msg.from === "user" ? "user-msg" : "bot-msg"
    //                     }`}
    //                 >
    //                   <MessageText content={msg.message} />
    //                   <div
    //                     className={`text-xs text-stone-500 font-medium mt-2 ${msg.from === "user"
    //                       ? "text-right text-white"
    //                       : "text-left text-stone-500"
    //                       }`}
    //                   >
    //                     {dayjs(msg.timestamp).format("HH:mm")}
    //                   </div>
    //                 </div>
    //               </div>
    //             ))}
    //             <div ref={messagesEndRef} />
    //           </div>

    //           <div className="flex items-center absolute bottom-0 left-0 right-0 m-8 p-1 bg-white border border-stone-300 shadow-sm rounded-full overflow-hidden focus-within:border-primary/70">
    //             <Input
    //               size="large"
    //               placeholder="Ask a question..."
    //               className="flex-1 border-none focus:!shadow-none  rounded-full pl-5 h-14"
    //               onPressEnter={(e) => handleSendMessage(activeTab, e.target.value)}
    //             />
    //             <Button
    //               size="large"
    //               type="primary"
    //               className="shadow-none rounded-full w-14 h-14 p-0"
    //               onClick={(e) => handleSendMessage(activeTab, e.target.previousElementSibling.value)}
    //             >
    //               <SendHorizonal />
    //             </Button>
    //           </div>
    //         </div>
    //       </>
    //     )}
    //   </div>
    // </div>
  );
};

export default Index;
