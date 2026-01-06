import { Link } from 'react-router-dom';
import movingGradient from '../assets/moving-gradient.svg';
import movingGradientDark from '../assets/moving-gradient-dark.svg';
type DoorProps = {
    number: number,
    open: boolean
}

export default function Door({ number, open }: DoorProps) {
    return (
        <div className='h-[100svh] w-[40svh] flex-shrink-0 flex flex-col justify-end items-center gap-[3%]'>
            <div className='h-[10%] w-full flex justify-center items-end'>
                <div id='sign' className={`flex px-[1.5svh] py-0 border-[1svh] neon ${open ? 'border-light-teal text-teal' : 'border-light-red text-light-red'} bg-white rounded-md`}>
                    <h2>{open ? 'open' : 'occupied'}</h2>
                </div>
            </div>
            <div className={`relative h-[75%] w-[100%] aspect-[1/2] 
                border-[2svh] border-baby-pink/80 bg-gray-50/50
                flex flex-row justify-start items-center 
                p-[4svh] pb-[5svh] pr-[1svh]
                group
                ${open ? 'cursor-pointer' : 'door-pulse'}
            `}>
                {open && 
                    <Link to='/room' className='absolute inset-0 z-20'></Link>
                }
                <div className="relative w-[80%] h-[90%] bg-white">
                    <img className='absolute inset-0 m-auto content-cover w-full h-full'
                        src={open ? movingGradient : movingGradientDark} alt='moving-gradient'
                    />
                    <div className='absolute w-full h-full z-[5] flex flex-col justify-center items-start
                     backdrop-blur-xl border-[1svh] border-white/30 p-[3svh] pt-0'>
                        <span className='w-full text-white/75 text-[17svh] text-right -my-[5svh] carlmarx'>{number}</span>
                        <svg width="full" height="20svh" viewBox="0 0 132 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M94.0974 126.491C98.332 127.78 102.096 123.943 102.766 119.626C103.437 115.309 99.7775 110.319 93.0685 108.645C86.3596 106.971 78.4084 113.293 77.0636 121.949C75.1473 134.284 85.8265 142.892 95.1264 144.336C113.066 147.123 122.885 132.858 126.134 120.098C130.664 102.313 119.555 84.9671 104.716 74.4506C92.9645 66.1218 79.4132 57.8869 68.9571 43.6297C58.5011 29.3725 51.0069 4.20587 32.5878 4.50265C14.1687 4.79944 6.21185 23.1442 5.71009 38.8573C5.3001 51.6962 16.9598 68.3972 16.9598 68.3972C16.9598 68.3972 1.76505 80.5644 4.93723 96.8483C8.1094 113.132 30.3797 116.592 30.3797 116.592C30.3797 116.592 29.9411 131.65 43.5894 137.593C57.2377 143.537 65.4848 135.31 65.4848 135.31" stroke="rgba(255, 255, 250, 0.3)" 
                            stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
                <div className='w-[20%] p-[5%]'>
                    <div className='relative z-[10] aspect-square rounded-full bg-gray-300'>
                        <div className={`absolute -left-[140%] top-1/2 -translate-y-1/2 
                        w-[200%] h-[30%] rounded-full bg-gray-2
                        ${open ? 'handle-turn' : 'handle-rattle'}
                        `}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}