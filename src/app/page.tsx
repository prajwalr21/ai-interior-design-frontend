'use client'
import { SERVER_URL } from '@/const'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, FormEvent, useState, useRef, MouseEvent, useEffect } from 'react'

interface Rect {
  x0: number,
  x1: number,
  y0: number,
  y1: number
}

interface Result {
  b64_json: string
  revised_prompt: string
  url: string
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<Blob | null>(null)
  const [img, setImg] = useState<string>('')
  const [grab, setGrab] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  let styleRef = useRef<HTMLSelectElement>(null)
  let pColorRef = useRef<HTMLInputElement>(null)
  let sColorRef = useRef<HTMLInputElement>(null)
  const rectRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const [results, setResults] = useState<Result[]>([])
  const [rect, setRect] = useState<Rect>({x0: 0, y0: 0, x1: 0, y1: 0})

  const scrollToLoader = () => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const scrollToResults = () => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };
  
  useEffect(() => {
    if (loading) {
      scrollToLoader();
    } else if (results.length !== 0) {
      scrollToResults()
    }
  }, [loading, results]);

  const maskHandler = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (rectRef.current && canvasRef.current && imageRef.current) {
        rectRef.current.style.opacity = '0'

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')

        if (ctx) {
          canvas.width = imageRef.current.width
          canvas.height = imageRef.current.height
          ctx.drawImage(imageRef.current, 0,0, imageRef.current.width, imageRef.current.height)
          
          ctx.clearRect(rect.x0 - imageRef.current.offsetLeft, rect.y0 - imageRef.current.offsetTop, rect.x1-rect.x0, rect.y1-rect.y0)

          const newImageURL = canvas.toDataURL('image/png')
          setImg(newImageURL)
        }
    }
  }

  const clearHandler = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    setResults([])
    setLoading(false)
    setImg('')
    setOriginalImage(null)
    if (styleRef.current && pColorRef.current && sColorRef.current) {
      styleRef.current.value = "Select a base style"
      sColorRef.current.value = ""
      pColorRef.current.value = ""
    }
  }

  function showRect() {
    if (rectRef.current && rect) {
      rectRef.current.style.display = "block"
      rectRef.current.style.position = "absolute"
      rectRef.current.style.left = rect.x0 + 'px'
      rectRef.current.style.top = rect.y0 + 'px'
      rectRef.current.style.width = (rect.x1 - rect.x0) + 'px'
      rectRef.current.style.height = (rect.y1 - rect.y0) + 'px'
    }
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setOriginalImage(e.target.files[0]);
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true)
    const formData = new FormData()
    formData.append("imageFile", img ?? '')
    formData.append("style", styleRef.current?.value ?? '')
    formData.append("pColor", pColorRef.current?.value ?? '')
    formData.append("sColor", sColorRef.current?.value ?? '')
    axios
      .post(SERVER_URL ?? '', formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((res) => {
        setResults(res.data)
        setLoading(false)
      })
      .catch(err => {
        setLoading(false)
      })
  }

  const mouseDownHandler = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setGrab(true)
    if (rect) {
      setRect({
        x0: e.clientX,
        y0: e.clientY,
        x1: e.clientX,
        y1: e.clientY
      })
    }
  }

  const mouseMoveHandler = (e: MouseEvent<HTMLImageElement>) => {
    if (grab) {
      setRect(prev => {
        return {
          ...prev,
          x1: e.clientX,
          y1: e.clientY
        }
      })
      showRect()
    }
  }

  const mouseUpHandler = (e: MouseEvent<HTMLImageElement>) => {
    setGrab(false)
  }


  return (
    <div className='min-h-screen w-full bg-white flex justify-center items-center flex-col'>
      {/* <img src={URL.createObjectURL(image ?? new Blob())} alt="Some image" /> */}
      <form className='flex flex-col gap-4 items-center' onSubmit={onSubmit}>
        <input key={originalImage ? 'file-input-with-image' : 'file-input-without-image'} className='text-xs w-max relative' onChange={onFileChange} type="file" name="image-file"/>
        { originalImage &&
          <div className='flex flex-col items-center gap-3'>
            <img alt="original image" ref={imageRef} className='w-full h-auto' onMouseDown={mouseDownHandler} onMouseMove={mouseMoveHandler} onMouseUp={mouseUpHandler} src={URL.createObjectURL(originalImage ?? new Blob())} />
            <div className='flex flex-row gap-4 justify-center items-center'>
              <button onClick={maskHandler} className="text-xs px-6 py-3 rounded-full bg-gray-200 w-max">Mask</button>
              {/* <button onClick={resetMaskHandler} className="text-xs px-6 py-3 rounded-full bg-gray-200 w-max">Reset</button> */}
            </div>
            <canvas ref={canvasRef}></canvas>
          </div>
        }
        <div ref={rectRef} className='border-2 border-red-500 pointer-events-none hidden'></div>
        <select ref={styleRef} className='text-xs px-4 py-2 bg-gray-200 rounded-md'>
          <option value="Select a base style" defaultChecked>Select a base style</option>
          <option value="Contemporary">Contemporary</option>
          <option value="Minimalistic">Minimalistic</option>
          <option value="Classic">Classic</option>
          <option value="Eco-Friendly">Eco-Friendly</option>
        </select>
        <input ref={pColorRef} className="text-xs px-4 py-3 bg-gray-100 rounded-md" placeholder='Primary color'/>
        <input ref={sColorRef} className="text-xs px-4 py-3 bg-gray-100 rounded-md" placeholder='Secondary color'/>
        <button className='px-4 py-3 bg-blue-400 w-max rounded-full text-xs text-white' type='submit'>Generate</button>
      </form>
      <div ref={resultRef} className="flex items-center justify-center mt-10">
        {loading && <div className='mt-10 flex items-center justify-center'>
          <div className="border-8 border-[#f3f3f3] border-t-8 border-t-[#3498db] rounded-[50%] w-12 h-12 animate-spin"></div>
        </div>}
        {results.length > 0 && 
          <div ref={resultsContainerRef} className='flex flex-col gap-4 w-full p-16'>
            <p className='text-xl self-center'>Results</p>
            {results.map((result, index) => {
              return (
                <p className='text-xs w-96 truncate cursor-pointer' key={index}>{index+1} - <span onClick={() => window.open(result.url, '_blank')} className='underline text-blue-500'>{result.url}</span></p>
              )
            })}
            <button className="self-center mt-4 text-xs px-6 py-3 rounded-full bg-red-400 text-white w-max" onClick={clearHandler}>Clear</button>
          </div>
        }
      </div>
    </div>
  )
}
