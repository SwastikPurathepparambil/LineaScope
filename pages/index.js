import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import { FiUpload } from "react-icons/fi";
import { SignOutButton, useClerk } from '@clerk/nextjs'
import { GoSignOut } from "react-icons/go";

const SignOutBtn = () => {
  const { signOut } = useClerk();
  return (
    <GoSignOut onClick={() => signOut()} /> 
  );
};


export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [currentSrc, setCurrentSrc] = useState('');
  const [messages, setMessages] = useState([
    {
      "message": "Hey, I'm Apollo! How can I help?",
      "type": "apiMessage"
    }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  
  // Handle errors
  const handleError = () => { 
    function errorHandling() {
      setMessages((prevMessages) => [...prevMessages, { "message": "There seems to be an error", "type": "apiMessage"}]);
      setLoading(false);
      setUserInput("");
    }
    errorHandling();
  }

  const handleWebChange = (event) => {
    setWebsiteUrl(event.target.value);
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    setCurrentSrc(websiteUrl);
  };
  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);

    if (!websiteUrl) {
      setMessages((prevMessages) => [...prevMessages, { "message": "Please input a website before asking a question.", "type": "apiMessage" }]);
      setLoading(false);
    } else {
      // // Send user question and history to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userInput, webUrl: websiteUrl}),
      });
      // const response = await fetch("http://localhost:3000/api/chat");
      console.log(response);
      if (!response.ok) {
        handleError();
        return;
      }

      // Reset user input
      setUserInput("");
      const data = await response.json();


      if (data.result.error === "Unauthorized") {
        handleError();
        return;
      }

      setMessages((prevMessages) => [...prevMessages, { "message": data["result"]["text"], "type": "apiMessage" }]);
      setLoading(false);
    }
    
    
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    if (messages.length >= 3) {
      setHistory([[messages[messages.length - 2].message, messages[messages.length - 1].message]]);
    }
    }, [messages])

  return (
    <>
      <Head>
        <title>LineaSpace</title>
        <meta name="description" content="EffiLex Website Reader" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/nav.png" />
      </Head>
      <div className={styles.topnav}>
        <div className = {styles.navlogo}>
        <Link href="/">LineaSpace</Link>
        </div>
        <div className = {styles.navlinks}>
          {/* <Link href="/notes">Notes</Link> */}
          <Link href="/">Websites</Link>
          <Link href="/pdf">PDFs</Link>
          <SignOutBtn />
        </div>
      </div>
      
      <main className={styles.main}>
      <div className={styles.mainSubOne}>
        <input
          type="text"
          placeholder="Enter website URL"
          value={websiteUrl}
          className={styles.inputfield}
          onChange={handleWebChange}
        />

        <svg viewBox='0 0 20 20' onClick={handleButtonClick} className={styles.svginputicon} xmlns='http://www.w3.org/2000/svg'>
        <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
        </svg>

        <br /><br />

        <iframe sandbox="allow-same-origin allow-scripts allow-popups allow-forms" id={styles.myiframe} src={currentSrc} title="Website Frame" />
      </div>
      <div className={styles.mainSubTwo}>
        <div className = {styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
          {messages.map((message, index) => {
            return (
              // The latest message sent by the user will be animated while waiting for a response
                <div key = {index} className = {message.type === "userMessage" && loading && index === messages.length - 1  ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  {message.type === "apiMessage" ? <Image src = "/nav.png" alt = "AI" width = "30" height = "30" className = {styles.boticon} priority = {true} /> : <Image src = "/usericon.png" alt = "Me" width = "30" height = "30" className = {styles.usericon} priority = {true} />}
                <div className = {styles.markdownanswer}>
                  {/* Messages are being rendered in Markdown format */}
                  <ReactMarkdown linkTarget = {"_blank"}>{message.message}</ReactMarkdown>
                  </div>
                </div>
            )
          })}
          </div>
        </div>
            <div className={styles.center}>
              
              <div className = {styles.cloudform}>
                
                <form onSubmit = {handleSubmit}>
                  <textarea 
                  disabled = {loading}
                  onKeyDown={handleEnter}
                  ref = {textAreaRef}
                  autoFocus = {false}
                  rows = {1}
                  maxLength = {512}
                  type="text" 
                  id="userInput" 
                  name="userInput" 
                  placeholder = {loading? "Waiting for response..." : "Type your question..."}  
                  value = {userInput} 
                  onChange = {e => setUserInput(e.target.value)} 
                  className = {styles.textarea}
                  />
                    <button 
                    type = "submit" 
                    disabled = {loading}
                    className = {styles.generatebutton}
                    >
                    {loading ? <div className = {styles.loadingwheel}><CircularProgress color="inherit" size = {20}/> </div> : 
                    // Send icon SVG in input field
                    <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
                  </button>
                </form>
              </div>
              
          </div>
        </div>
      </main>
    </>
  )
}
