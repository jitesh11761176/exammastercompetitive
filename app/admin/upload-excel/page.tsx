'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Download, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

export default function ExcelUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [createTest, setCreateTest] = useState(false)
  const [testTitle, setTestTitle] = useState('')
  
  // Category management
  const [categories, setCategories] = useState<any[]>([])
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new' | 'nested'>('existing')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [nestedCategoryName, setNestedCategoryName] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    // Validate category selection
    if (categoryMode === 'existing' && !selectedCategory) {
      toast.error('Please select a category')
      return
    }
    if (categoryMode === 'new' && !newCategoryName) {
      toast.error('Please enter a new category name')
      return
    }
    if (categoryMode === 'nested' && (!parentCategoryId || !nestedCategoryName)) {
      toast.error('Please select a parent category and enter nested category name')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Category data
      formData.append('categoryMode', categoryMode)
      if (categoryMode === 'existing') {
        formData.append('categoryId', selectedCategory)
      } else if (categoryMode === 'new') {
        formData.append('newCategoryName', newCategoryName)
        formData.append('newCategoryDescription', newCategoryDescription)
      } else if (categoryMode === 'nested') {
        formData.append('parentCategoryId', parentCategoryId)
        formData.append('nestedCategoryName', nestedCategoryName)
      }
      
      // Test creation data
      if (createTest && testTitle) {
        formData.append('createTest', 'true')
        formData.append('testTitle', testTitle)
      }

      const response = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setFile(null)
        setTestTitle('')
        setCreateTest(false)
        setNewCategoryName('')
        setNewCategoryDescription('')
        setNestedCategoryName('')
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Refresh categories
        fetchCategories()
      } else {
        toast.error(data.message || 'Upload failed')
      }
      
      setResult(data)
    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed'
      toast.error(errorMsg)
      setResult({ success: false, message: errorMsg })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      'Question Number',
      'Question Text',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Answer (A/B/C/D)',
      'Explanation',
      'Subject',
      'Topic',
      'Category',
      'Marks',
      'Difficulty (EASY/MEDIUM/HARD)'
    ]

    const sampleData = [
      [
        '1',
        'What is the capital of India?',
        'Mumbai',
        'Delhi',
        'Kolkata',
        'Chennai',
        'B',
        'Delhi is the capital of India',
        'General Knowledge',
        'Indian Geography',
        'KVS PRT',
        '1',
        'EASY'
      ],
      [
        '2',
        'Which is the largest planet?',
        'Earth',
        'Mars',
        'Jupiter',
        'Saturn',
        'C',
        'Jupiter is the largest planet in our solar system',
        'Science',
        'Astronomy',
        'KVS PRT',
        '1',
        'MEDIUM'
      ]
    ]

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question-template.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully!')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Excel/CSV Question Uploader
          </CardTitle>
          <CardDescription>
            The easiest way to upload your exam questions - No AI, No errors, Just works!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2 text-lg">📥 Step 1: Download Template</h3>
            <p className="text-sm text-blue-800 mb-4">
              Download our Excel/CSV template with the correct format
            </p>
            <Button onClick={downloadTemplate} variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Fill Template */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2 text-lg">✏️ Step 2: Fill Your Questions</h3>
            <p className="text-sm text-green-800 mb-3">
              Open the template in Excel or Google Sheets and fill in your questions
            </p>
            <ul className="text-sm text-green-800 space-y-2 list-disc list-inside">
              <li>One question per row</li>
              <li>Correct answer: Use <strong>A, B, C, or D</strong> (uppercase)</li>
              <li>Category: e.g., <strong>&quot;KVS PRT&quot;</strong>, <strong>&quot;SSC CGL&quot;</strong>, etc.</li>
              <li>Save as <strong>.csv</strong> or <strong>.xlsx</strong></li>
            </ul>
          </div>

          {/* Category Selection - Step 2.5 */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold text-orange-900 mb-4 text-lg">📁 Step 2.5: Select or Create Category</h3>
            
            {/* Category Mode Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryMode('existing')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    categoryMode === 'existing'
                      ? 'border-orange-500 bg-orange-100 text-orange-900'
                      : 'border-orange-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="font-semibold">Use Existing</div>
                  <div className="text-xs mt-1">Select from list</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('new')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    categoryMode === 'new'
                      ? 'border-orange-500 bg-orange-100 text-orange-900'
                      : 'border-orange-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="font-semibold">Create New</div>
                  <div className="text-xs mt-1">New category</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('nested')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    categoryMode === 'nested'
                      ? 'border-orange-500 bg-orange-100 text-orange-900'
                      : 'border-orange-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="font-semibold">Nested Category</div>
                  <div className="text-xs mt-1">Subcategory</div>
                </button>
              </div>

              {/* Existing Category */}
              {categoryMode === 'existing' && (
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <Label htmlFor="existing-category" className="font-medium">Select Category</Label>
                  <select
                    id="existing-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    <option value="">-- Select a category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No categories yet. Create a new one!</p>
                  )}
                </div>
              )}

              {/* New Category */}
              {categoryMode === 'new' && (
                <div className="bg-white p-4 rounded-lg border border-orange-200 space-y-3">
                  <div>
                    <Label htmlFor="new-category-name" className="font-medium">
                      Category Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-category-name"
                      type="text"
                      placeholder="e.g., KVS PRT 2024"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-category-desc" className="font-medium">
                      Description (Optional)
                    </Label>
                    <Input
                      id="new-category-desc"
                      type="text"
                      placeholder="e.g., Kendriya Vidyalaya Sangathan PRT Exam"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Nested Category */}
              {categoryMode === 'nested' && (
                <div className="bg-white p-4 rounded-lg border border-orange-200 space-y-3">
                  <div>
                    <Label htmlFor="parent-category" className="font-medium">
                      Parent Category <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="parent-category"
                      value={parentCategoryId}
                      onChange={(e) => setParentCategoryId(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">-- Select parent category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nested-category-name" className="font-medium">
                      Subcategory Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nested-category-name"
                      type="text"
                      placeholder="e.g., Prelims, Mains, Interview"
                      value={nestedCategoryName}
                      onChange={(e) => setNestedCategoryName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    💡 Nested categories help organize related exams (e.g., UPSC → Prelims, UPSC → Mains)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload File */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-4 text-lg">📤 Step 3: Upload File</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="text-base">Select your CSV/Excel file</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="mt-2 cursor-pointer"
                />
              </div>

              {file && (
                <>
                  {/* Optional Test Creation */}
                  <div className="bg-white p-4 rounded-lg border-2 border-indigo-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="create-test"
                        checked={createTest}
                        onChange={(e) => setCreateTest(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <Label htmlFor="create-test" className="font-semibold text-indigo-900 cursor-pointer">
                        🎯 Create Test from Uploaded Questions
                      </Label>
                    </div>
                    {createTest && (
                      <div className="mt-3">
                        <Label htmlFor="test-title" className="text-sm">Test Title</Label>
                        <Input
                          id="test-title"
                          type="text"
                          placeholder="e.g., KVS PRT General Knowledge - 180 Questions"
                          value={testTitle}
                          onChange={(e) => setTestTitle(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A complete test will be created with all uploaded questions
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    <Button onClick={handleUpload} disabled={uploading || (createTest && !testTitle)} size="lg">
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Questions
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-6 border-2 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-4 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold text-lg ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? '✅ Upload Successful!' : '❌ Upload Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.success && result.data && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-3 rounded border border-green-300">
                        <p className="text-gray-600">Questions Uploaded</p>
                        <p className="text-2xl font-bold text-green-600">{result.data.questionsCreated}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-300">
                        <p className="text-gray-600">Category</p>
                        <p className="font-semibold text-green-900">{result.data.category}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-300">
                        <p className="text-gray-600">Subjects Created</p>
                        <p className="text-2xl font-bold text-green-600">{result.data.subjectsCreated}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-300">
                        <p className="text-gray-600">Status</p>
                        <p className="font-semibold text-green-900">Ready for Tests!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Guide */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
              💡 Quick Tips
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Use the template - it has all required columns</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Correct Answer must be A, B, C, or D (uppercase)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Category will be auto-created if it doesn&apos;t exist</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>You can upload 1000+ questions at once!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>No AI means NO ERRORS - guaranteed!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Upload multiple times to add more questions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
