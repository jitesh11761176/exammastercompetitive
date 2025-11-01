'use client'

import { useState } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function QuestionsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)
      setFile(null)
    } catch (error) {
      setResult({ success: 0, errors: ['Upload failed'] })
    } finally {
      setUploading(false)
    }
  }

  const downloadSample = () => {
    const csv = `topicId,questionText,questionImage,optionA,optionB,optionC,optionD,correctOption,explanation,difficulty,marks,negativeMarks,timeToSolve,tags
cm4vwxyz123456789012,What is 2+2?,,"2","3","4","5",C,Addition of two numbers,EASY,1,0.25,60,"math,arithmetic"
cm4vwxyz123456789012,What is the capital of France?,,"London","Paris","Berlin","Madrid",B,France is located in Europe,MEDIUM,1,0.25,60,"geography,europe"
cm4vwxyz123456789012,What is the speed of light?,,"299792 km/s","300000 km/s","299000 km/s","298000 km/s",A,Speed of light in vacuum,HARD,2,0.5,90,"physics,constants"`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions-template.csv'
    a.click()
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Question Bank Management</h1>
        <p className="text-muted-foreground">
          Bulk import questions via CSV upload
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Import multiple questions at once using a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              
              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </div>

            {result && (
              <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                {result.errors.length === 0 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.errors.length === 0 ? (
                    <span>✅ Successfully imported {result.success} questions!</span>
                  ) : (
                    <div>
                      <p>Imported: {result.success} | Errors: {result.errors.length}</p>
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>... and {result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download a sample CSV file with the correct format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Required Columns:</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>topicId (must exist in database)</li>
                  <li>questionText</li>
                  <li>optionA, optionB, optionC, optionD</li>
                  <li>correctOption (A/B/C/D)</li>
                  <li>explanation</li>
                  <li>difficulty (EASY/MEDIUM/HARD)</li>
                  <li>marks, negativeMarks, timeToSolve</li>
                  <li>tags (comma-separated)</li>
                </ul>
              </div>

              <Button onClick={downloadSample} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
