"use client"

import { useState } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import tus from "tus-js-client"

export default function VideoUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const channelId = "YOUR_CHANNEL_ID" // You can also make this dynamic

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)

    try {
      // 1. Get Arvan upload URL from your backend
      const res = await axios.post("/vod/get-upload-url/", {
        channel_id: channelId,
        file_name: file.name,
      })

      const uploadUrl = res.data.upload_url

      // 2. Upload using tus-js-client
      const upload = new tus.Upload(file, {
        endpoint: uploadUrl,
        chunkSize: 5242880, // 5MB
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (error) => {
          console.error("Upload failed:", error)
          alert("Upload failed.")
          setUploading(false)
        },
        onProgress: (bytesSent, bytesTotal) => {
          const percentage = Math.floor((bytesSent / bytesTotal) * 100)
          setUploadProgress(percentage)
        },
        onSuccess: () => {
          alert("Upload finished!")
          setUploading(false)
          setUploadProgress(0)
        },
      })

      upload.start()
    } catch (err) {
      console.error(err)
      alert("Failed to get upload URL from backend.")
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md p-4 space-y-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold">Upload Video to VOD</h2>

      <Input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>

      {uploading && (
        <Progress value={uploadProgress} className="h-3" />
      )}
    </div>
  )
}
