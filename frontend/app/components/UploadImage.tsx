"use client";
export function UploadImage() {

    async function onFileSelect(e: any) {

    }

    return <>
        <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
            <div className="h-full flex justify-center">
                <div className="h-full flex justify-center flex-col">
                    +
                    <input className="bg-red-400 w-40 h-40" type="file" style={{position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%"}} onChange={onFileSelect} />
                </div>
            </div>
        </div>
    </>
}