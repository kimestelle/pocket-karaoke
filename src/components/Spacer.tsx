
export default function Spacer({ratio}: {ratio?: number}) {
    return(
        <div className="h-full flex flex-col"
            style={{ aspectRatio: ratio ? `1/${ratio}` : '1' }}>
        </div>
    )
}