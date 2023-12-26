'use client'
import { SERVER_URL } from '@/const'
import axios from 'axios'
import { ChangeEvent, FormEvent, useState, useRef, MouseEvent } from 'react'

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
  const styleRef = useRef<HTMLSelectElement>(null)
  const pColorRef = useRef<HTMLInputElement>(null)
  const sColorRef = useRef<HTMLInputElement>(null)
  const rectRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [results, setResults] = useState<Result[]>([])
  const [rect, setRect] = useState<Rect>({x0: 0, y0: 0, x1: 0, y1: 0})

  const maskHandler = async (e: MouseEvent<HTMLButtonElement>) => {
    console.log(rect)
    e.preventDefault()
    e.stopPropagation()
    if (rectRef.current && canvasRef.current && imageRef.current) {
        rectRef.current.style.opacity = '0'

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')

        if (ctx) {
          canvas.width = imageRef.current.width
          canvas.height = imageRef.current.height
          ctx.drawImage(imageRef.current, 0,0)
          
          ctx.clearRect(rect.x0 - imageRef.current.offsetLeft, rect.y0 - imageRef.current.offsetTop, rect.x1-rect.x0, rect.y1-rect.y0)

          const newImageURL = canvas.toDataURL('image/png')
          // console.log(newImageURL)
          // const response = await fetch(newImageURL)
          // const blob = await response.blob()
          // const file = new File([blob], 'modified-image.png', {type: 'image/png'})
          setImg(newImageURL)
        }
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
    console.log(styleRef.current?.value, pColorRef.current?.value, sColorRef.current?.value, img)
    const formData = new FormData()
    formData.append("imageFile", img ?? '')
    formData.append("style", styleRef.current?.value ?? '')
    formData.append("pColor", pColorRef.current?.value ?? '')
    formData.append("sColor", sColorRef.current?.value ?? '')
    axios
      .post(SERVER_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((res) => {
        setResults(res.data)
      })
  }

  const mouseDownHandler = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setGrab(true)
    if (rect) {
      console.log(e.pageX, e.clientY)
      setRect(prev => {
        return {
          x0: e.clientX,
          y0: e.clientY,
          x1: e.clientX,
          y1: e.clientY
        }
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
        <input className='text-xs w-max relative' onChange={onFileChange} type="file" name="image-file"/>
        { originalImage &&
          <div className='flex flex-col items-center gap-3'>
            <img ref={imageRef} className='w-full h-auto' onMouseDown={mouseDownHandler} onMouseMove={mouseMoveHandler} onMouseUp={mouseUpHandler} src={URL.createObjectURL(originalImage ?? new Blob())} />
            <button onClick={maskHandler} className="text-xs px-6 py-3 rounded-full bg-gray-200 w-max">Mask</button>
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
      {results.length > 0 && 
        <div className='flex flex-col gap-4 w-full p-16'>
          <p className='text-xl self-center'>Results</p>
          {results.map((result, index) => {
            return (
              <p className='text-xs' key={index}>{index+1} - <span onClick={() => window.open(result.url, '_blank')} className='underline text-blue-500'>{result.url}</span></p>
            )
          })}
        </div>
      }
    </div>
  )
}
