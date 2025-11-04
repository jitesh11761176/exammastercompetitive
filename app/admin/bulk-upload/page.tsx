"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, Image, Table, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<'pdf' | 'image' | 'csv'>('pdf')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (selectedFile.size > maxSize) {
        toast.error('File too large. Maximum size is 50MB.')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('autoTag', 'true')

      // Show processing toast
      toast.loading('Processing file... This may take a minute for large PDFs', {
        id: 'upload-progress'
      })

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      toast.dismiss('upload-progress')

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        toast.success(`✓ Extracted ${data.questions.length} questions!${data.created ? ` Created ${data.created} in database.` : ''}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `question,optionA,optionB,optionC,optionD,answer,explanation,subject,topic,difficulty,marks
"What is 2+2?","3","4","5","6","B","Basic addition","Mathematics","Arithmetic","easy","1"
"Capital of India?","Mumbai","Delhi","Kolkata","Chennai","B","Delhi is the capital","General Knowledge","Geography","easy","1"`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question-template.csv'
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bulk Upload</h1>
        <p className="text-gray-600">
          Upload PDFs, images, or CSV files to extract questions
        </p>
      </div>

      {/* Upload Type Selector */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition ${
            uploadType === 'pdf'
              ? 'ring-2 ring-blue-500'
              : 'hover:border-blue-300'
          }`}
          onClick={() => setUploadType('pdf')}
        >
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-1">PDF</h3>
            <p className="text-sm text-gray-600">Question papers, books</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition ${
            uploadType === 'image'
              ? 'ring-2 ring-blue-500'
              : 'hover:border-blue-300'
          }`}
          onClick={() => setUploadType('image')}
        >
          <CardContent className="pt-6 text-center">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-12 h-12 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-1">Images</h3>
            <p className="text-sm text-gray-600">OCR extraction</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition ${
            uploadType === 'csv'
              ? 'ring-2 ring-blue-500'
              : 'hover:border-blue-300'
          }`}
          onClick={() => setUploadType('csv')}
        >
          <CardContent className="pt-6 text-center">
            <Table className="w-12 h-12 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-1">CSV/Excel</h3>
            <p className="text-sm text-gray-600">Structured data</p>
          </CardContent>
        </Card>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            {uploadType === 'pdf' && 'Upload PDF files (max 50MB)'}
            {uploadType === 'image' && 'Upload images (JPG, PNG)'}
            {uploadType === 'csv' && 'Upload CSV or Excel files'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
            <input
              type="file"
              onChange={handleFileChange}
              accept={
                uploadType === 'pdf'
                  ? '.pdf'
                  : uploadType === 'image'
                  ? 'image/*'
                  : '.csv,.xlsx'
              }
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-semibold mb-1">
                Drop file here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                {uploadType === 'pdf' && 'PDF files up to 50MB'}
                {uploadType === 'image' && 'JPG, PNG up to 10MB'}
                {uploadType === 'csv' && 'CSV or Excel files'}
              </p>
            </label>
          </div>

          {file && (
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setFile(null)}
                className="text-red-500"
              >
                Remove
              </Button>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Process & Extract
              </>
            )}
          </Button>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <h3 className="font-semibold text-green-900 mb-2">
                ✓ Extraction Complete!
              </h3>
              <p className="text-sm text-green-700">
                Extracted: {result.questions.length} questions
              </p>
              {result.created > 0 && (
                <p className="text-sm text-green-700">
                  Created in database: {result.created} questions
                </p>
              )}
              {result.placement && (
                <p className="text-xs text-green-600">
                  Placed in: Category ID {result.placement.categoryId?.slice(0, 8)}...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Template */}
      {uploadType === 'csv' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="font-semibold mb-2">Need a template?</p>
            <p className="text-sm text-gray-600 mb-3">
              Download our CSV template with the correct format
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
