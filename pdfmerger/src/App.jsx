import { useState, useEffect, useRef } from 'react'
import './App.css'
import pdfImage from './assets/pdfimage.png';
import Sortable from 'sortablejs';
import { IoClose } from 'react-icons/io5'

function App() {

  const [files, setFiles] = useState([]);
  const [fileComing, setFileComing] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    syncFiles();
    console.log(files);
  }, [files]);

  useEffect(() => {
    if (!listRef.current || files.length === 0) return;

    const sortable = new Sortable(listRef.current, {
      animation: 150,
      onEnd: (evt) => {
        setFiles(prevFiles => {
          const newFiles = [...prevFiles];
          const [moved] = newFiles.splice(evt.oldIndex, 1);
          newFiles.splice(evt.newIndex, 0, moved);
          return newFiles;
        });
      },
    });

    // cleanup to avoid multiple Sortables stacking
    return () => sortable.destroy();

  }, [files.length]); // rerun when files go from 0 → >0 or cleared

  const syncFiles = () => {
    // console.log("File leave", files);
    const dT = new DataTransfer();
    for (const file of files) {
      dT.items.add(file.file);
    }
    let input = document.getElementById("fileUpload");
    input.files = dT.files;
    // console.log(input.files);
  }
  const addFiles = (fileList) => {
    // console.log("File enter", fileList);
    setFiles(prevFiles => prevFiles.concat(Array.from(fileList).map((file) => (
      {
        id: crypto.randomUUID(),
        file
      }
    ))));
  }
  const handleChange = (e) => {
    // console.log("hi", e.target.files);
    addFiles(e.target.files);
    // console.log("bye", e.target.files);
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      for (const file of files) {
        data.append('pdf', file.file);
      }
      const response = await fetch("http://localhost:3000/upload", {
        method: 'POST',
        body: data
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      let t = new Date().getTime().toLocaleString();

      a.download = `${t}-merged.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFiles([]);
    }
    catch (error) {
      console.error(error);
    }

  }

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
    setFileComing(false);
  }

  const handleRemoveFile = (e, id) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  function returnFileSize(number) {
    if (number < 1e3) {
      return `${number} bytes`;
    } else if (number >= 1e3 && number < 1e6) {
      return `${(number / 1e3).toFixed(1)} KB`;
    }
    return `${(number / 1e6).toFixed(1)} MB`;
  }


  return (
    <div className='bg-emerald-100 container min-w-[100%] min-h-screen mx-auto items-center flex flex-col justify-center text-center space-y-2'>
      <h1 className='text-2xl font-semibold mb-6'>Merge your PDFs like a Charm!</h1>
      <form onSubmit={(e) => handleSubmit(e)} className='flex flex-col items-center space-y-2'>
        <label htmlFor="fileUpload" className=' border-3 border-emerald-400 bg-emerald-300 p-3 text-xl font-semibold rounded-md hover:bg-emerald-600 hover:cursor-pointer hover:text-white'>{files.length === 0 ? "Upload PDF files" : "Add more files"}</label>
        <input type="file" multiple accept='.pdf' id="fileUpload" className='hidden' onChange={(e) => handleChange(e)} />
        <div
          className={`dropcontainer preview bg-white w-[60vw] min-h-[60vh] flex flex-col justify-center items-center rounded-xl my-6 
          ${fileComing ? "border-red-400 border-4 shadow-[0_0_30px_30px_rgba(255,0,0,0.2)]" : " border-emerald-400 border-4"}`}

          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => { e.preventDefault(); setFileComing(true); }}
          onDragLeave={(e) => setFileComing(false)}
          onDrop={(e) => handleDrop(e)}
        >
          {files.length === 0
            ? <p className={`text-xl ${fileComing ? "":""}`}>{!fileComing ? "Or drop them here": "I am ready to catch it!"}</p>
            : <ol className='p-6 grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-4 space-x-10 space-y-4' ref={listRef}>
              {files.map(({ id, file }, index) => {
                return (
                  <li className='group file-item flex relative flex-col justify-between items-center rounded-lg bg-emerald-200 border border-emerald-400 max-w-32 min-h-36 p-1 overflow-hidden hover:border-emerald-600 hover:border-2 hover:shadow-emerald-300 hover:shadow-lg' key={id}>
                    <div className='absolute z-40 text-white rounded-full opacity-0 bg-red-400 px-1 py-1 top-1 right-0.5 group-hover:opacity-100 cursor-pointer hover:bg-red-600' title='remove pdf' onClick={(e) => handleRemoveFile(e, id)}><IoClose /></div>
                    <div className="flex flex-col justify-between items-center">
                      <a href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noopener noreferrer" className='flex flex-col justify-center items-center'>
                        <img src={pdfImage} alt="pdfimage" className="" height="30px" width="30px" />
                        <span className='text-md text-center' title={file.name}>{file.name}</span>
                        <span className='text-md'>{returnFileSize(file.size)}</span>
                      </a>
                    </div>
                    <span className='text-sm font-semibold'>{index + 1}</span>
                  </li>
                )
              })}
            </ol>}
        </div>
        <button type="submit" className=' border-3 border-emerald-400 bg-emerald-300 p-3 text-xl font-semibold rounded-md hover:bg-emerald-600 hover:cursor-pointer hover:text-white'>Merge</button>
      </form>
      {/* <div className="dropcontainer h-1/2 w-1/2 p-4 border-2" onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e)}>dropcontainer</div> */}
    </div>
  )
}

export default App
