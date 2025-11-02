'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileText, Image as ImageIcon, Copy, Wand2, AlertCircle, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UploadMode = 'command' | 'file' | 'paste' | 'image' | 'smart';

interface ConfirmationData {
  type: 'category' | 'questions';
  action: string;
  details: any;
}

export default function AiAdminPage() {
  const [mode, setMode] = useState<UploadMode>('command');
  const [command, setCommand] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  
  // Smart Parser state
  const [categoryName, setCategoryName] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [smartContent, setSmartContent] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMode('file');
    }
  };

  const handleSubmit = async (event: React.FormEvent, skipConfirmation = false) => {
    event.preventDefault();
    
    if (!command && !file && !pasteContent) {
      toast.error('Please enter a command, upload a file, or paste content.');
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    toast.info('Processing request... This may take a moment.');

    const formData = new FormData();
    
    if (mode === 'command' && command) {
      formData.append('command', command);
    } else if (mode === 'file' && file) {
      formData.append('file', file);
    } else if ((mode === 'paste' || mode === 'image') && pasteContent) {
      // Create a text file from pasted content
      const blob = new Blob([pasteContent], { type: 'text/plain' });
      formData.append('file', blob, 'pasted-content.txt');
    }

    // Add confirmation flag
    if (skipConfirmation) {
      formData.append('confirmed', 'true');
    }

    try {
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong.');
      }

      // Handle confirmation requests from AI
      if (result.requiresConfirmation && !skipConfirmation) {
        setConfirmationData({
          type: result.confirmationType,
          action: result.action,
          details: result.details
        });
        setPendingFormData(formData);
        setShowConfirmation(true);
        setIsLoading(false);
        return;
      }

      // Display success message with details
      let successMsg = '';
      
      if (result.data?.categoryAction) {
        const action = result.data.categoryAction;
        if (action.type === 'created') {
          successMsg = `✅ Category Created: "${action.name}"\n📁 ${action.description || 'No description'}`;
        } else if (action.type === 'deleted') {
          successMsg = `🗑️ Category Deleted: "${action.name}"`;
        } else if (action.type === 'nested') {
          successMsg = `📂 Nested Category Created: "${action.child}" under "${action.parent}"`;
        }
        toast.success(successMsg, { duration: 5000 });
      }
      
      if (result.data?.examStructure) {
        const exam = result.data.examStructure;
        successMsg = `✅ Exam Created: "${exam.examName}"\n📝 ${exam.totalQuestions} questions\n⏱️ ${exam.duration} minutes\n🎯 Category: ${exam.categoryName}`;
        toast.success(successMsg, { duration: 5000 });
      }
      
      if (result.data?.questions) {
        successMsg = `✅ Questions Uploaded!\n📝 ${result.data.questions.savedCount} questions saved successfully\n🎯 Category: ${result.data.questions.categoryName}`;
        toast.success(successMsg, { duration: 5000 });
      }

      if (result.data?.testId) {
        toast.success(`🎉 Test created! ID: ${result.data.testId}`, { duration: 5000 });
      }

      setResponse(JSON.stringify(result.data, null, 2));
      
      // Reset form
      setCommand('');
      setPasteContent('');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to process AI task.';
      toast.error(`❌ Error: ${errorMsg}`, { duration: 7000 });
      setResponse(`Error: ${errorMsg}`);
      console.error('AI Processing Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);
    if (pendingFormData) {
      // Re-submit with confirmation
      setIsLoading(true);
      try {
        pendingFormData.append('confirmed', 'true');
        const response = await fetch('/api/admin/ai', {
          method: 'POST',
          body: pendingFormData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        // Process result same as above
        let successMsg = '';
        if (result.data?.categoryAction) {
          successMsg = `✅ Action completed: ${result.data.categoryAction.name}`;
          toast.success(successMsg, { duration: 5000 });
        }
        if (result.data?.questions) {
          successMsg = `✅ ${result.data.questions.savedCount} questions saved to "${result.data.questions.categoryName}"`;
          toast.success(successMsg, { duration: 5000 });
        }
        setResponse(JSON.stringify(result.data, null, 2));
        
        // Reset form
        setCommand('');
        setPasteContent('');
        setFile(null);
      } catch (error: any) {
        toast.error(`❌ Error: ${error.message}`, { duration: 7000 });
      } finally {
        setIsLoading(false);
        setPendingFormData(null);
        setConfirmationData(null);
      }
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingFormData(null);
    setConfirmationData(null);
    toast.info('Action cancelled');
  };

  // Smart Parser Handler - NO AI, pure regex parsing
  const handleSmartParse = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!categoryName || !smartContent) {
      toast.error('Please provide category name and exam content.');
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    toast.info('⚡ Parsing content with Smart Parser...');

    try {
      const response = await fetch('/api/admin/upload-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          examTitle: examTitle || undefined,
          content: smartContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse content.');
      }

      // Display success message
      let successMsg = `✅ Smart Parser Success!\n📁 Category: ${result.categoryName}\n📝 ${result.questionsCreated} questions created`;
      
      if (result.subjects?.length > 0) {
        successMsg += `\n📚 Subjects: ${result.subjects.join(', ')}`;
      }
      
      if (result.testId) {
        successMsg += `\n🎯 Test created: ${result.examTitle}`;
      }

      toast.success(successMsg, { duration: 7000 });
      setResponse(JSON.stringify(result, null, 2));
      
      // Reset form
      setCategoryName('');
      setExamTitle('');
      setSmartContent('');
      
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to parse content.';
      toast.error(`❌ Error: ${errorMsg}`, { duration: 7000 });
      setResponse(`Error: ${errorMsg}`);
      console.error('Smart Parser Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AI Content Uploader</CardTitle>
          <CardDescription>
            Generate exams or upload questions using AI - Multiple input methods available
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button
                type="button"
                variant={mode === 'command' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMode('command')}
              >
                <Wand2 className="w-5 h-5" />
                <span className="text-xs">AI Command</span>
              </Button>
              <Button
                type="button"
                variant={mode === 'file' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMode('file')}
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Upload File</span>
              </Button>
              <Button
                type="button"
                variant={mode === 'paste' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMode('paste')}
              >
                <Copy className="w-5 h-5" />
                <span className="text-xs">Copy/Paste</span>
              </Button>
              <Button
                type="button"
                variant={mode === 'image' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMode('image')}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">Image/PDF</span>
              </Button>
              <Button
                type="button"
                variant={mode === 'smart' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
                onClick={() => setMode('smart')}
              >
                <Zap className="w-5 h-5" />
                <span className="text-xs font-semibold">Smart Parser</span>
              </Button>
            </div>

            {/* AI Command Mode */}
            {mode === 'command' && (
              <div className="space-y-2">
                <Label htmlFor="command" className="text-base font-semibold">
                  <Wand2 className="w-4 h-4 inline mr-2" />
                  AI Command
                </Label>
                <Textarea
                  id="command"
                  placeholder="Examples:&#10;• Create a KVS PRT exam with 150 questions&#10;• Create category 'UPSC Civil Services'&#10;• Delete category 'Old Exams'&#10;• Create subcategory 'Prelims' under 'UPSC Civil Services'&#10;• Upload questions to SSC CGL category"
                  value={command}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommand(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[150px] font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Available Commands:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>� <strong>Create Exam:</strong> &quot;Create [exam name] with [N] questions&quot;</li>
                    <li>📁 <strong>Create Category:</strong> &quot;Create category [name]&quot;</li>
                    <li>🗑️ <strong>Delete Category:</strong> &quot;Delete category [name]&quot;</li>
                    <li>📂 <strong>Nested Category:</strong> &quot;Create [child] under [parent]&quot;</li>
                  </ul>
                </div>
              </div>
            )}

            {/* File Upload Mode */}
            {mode === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file" className="text-base font-semibold">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Upload Questions File
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  accept=".pdf,.txt,.md,.markdown,.json"
                  className="cursor-pointer"
                />
                {file && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">✅ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  📁 Supported: PDF, TXT, Markdown (.md), JSON
                </p>
              </div>
            )}

            {/* Copy/Paste Mode */}
            {mode === 'paste' && (
              <div className="space-y-2">
                <Label htmlFor="paste" className="text-base font-semibold">
                  <Copy className="w-4 h-4 inline mr-2" />
                  Paste Questions Content
                </Label>
                <Textarea
                  id="paste"
                  placeholder="Paste your questions here in any format (text, table, JSON, etc.)&#10;&#10;Example:&#10;Q1. What is the capital of India?&#10;A) Mumbai&#10;B) Delhi&#10;C) Kolkata&#10;D) Chennai&#10;Answer: B"
                  value={pasteContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPasteContent(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  📋 Paste questions in any format - AI will extract them automatically
                </p>
              </div>
            )}

            {/* Image/PDF Mode */}
            {mode === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="imageFile" className="text-base font-semibold">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Upload Image or PDF
                </Label>
                <Input
                  id="imageFile"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="cursor-pointer"
                />
                {file && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">✅ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  🖼️ Upload scanned question papers or screenshots (PDF, PNG, JPG, WEBP)
                </p>
              </div>
            )}

            {/* Smart Parser Mode - NO AI! */}
            {mode === 'smart' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-purple-900 mb-1">⚡ Smart Parser - AI-Free!</h3>
                      <p className="text-sm text-purple-800">
                        100% reliable pattern-based parsing. Perfect for structured exam papers with numbered questions and answer keys.
                      </p>
                      <p className="text-xs text-purple-700 mt-2">
                        ✨ <strong>Works best with:</strong> KVS PRT, UPSC, SSC, Banking exams, or any numbered question format
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryName" className="text-base font-semibold flex items-center gap-2">
                    📁 Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., KVS PRT 2024"
                    value={categoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryName(e.target.value)}
                    disabled={isLoading}
                    className="font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    Category will be auto-created if it doesn&apos;t exist
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examTitle" className="text-base font-semibold flex items-center gap-2">
                    🎯 Exam Title <span className="text-sm text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="examTitle"
                    placeholder="e.g., KVS PRT General English & Hindi - 180 Questions"
                    value={examTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExamTitle(e.target.value)}
                    disabled={isLoading}
                    className="font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, a test will be created automatically
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smartContent" className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Exam Content <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="smartContent"
                    placeholder="Paste your exam content here...&#10;&#10;Example:&#10;GENERAL ENGLISH&#10;&#10;1. Choose the synonym of 'BENEVOLENT':&#10;(a) Kind&#10;(b) Cruel&#10;(c) Angry&#10;(d) Happy&#10;&#10;2. Fill in the blank: He ___ to school.&#10;(a) go&#10;(b) goes&#10;(c) going&#10;(d) gone&#10;&#10;ANSWER KEY&#10;General English: 1-a, 2-b"
                    value={smartContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSmartContent(e.target.value)}
                    disabled={isLoading}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm font-semibold text-green-900 mb-2">📋 Supported Format:</p>
                    <ul className="text-xs text-green-800 space-y-1">
                      <li>✅ Numbered questions: <code>1. Question?</code></li>
                      <li>✅ Options: <code>(a) Option A</code>, <code>(b) Option B</code>, etc.</li>
                      <li>✅ Answer Key section: <code>ANSWER KEY</code></li>
                      <li>✅ Subject mapping: <code>Subject: 1-a, 2-b, 3-c</code></li>
                      <li>✅ Multiple subjects in same file</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Response Display */}
            {response && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Response</Label>
                <div className="p-4 bg-gray-50 border rounded-md max-h-60 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">{response}</pre>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCommand('');
                setPasteContent('');
                setFile(null);
                setResponse('');
                setCategoryName('');
                setExamTitle('');
                setSmartContent('');
              }}
              disabled={isLoading}
            >
              Clear All
            </Button>
            {mode === 'smart' ? (
              <Button 
                type="button" 
                onClick={handleSmartParse}
                disabled={isLoading || !categoryName || !smartContent} 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Parsing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Parse & Upload
                  </>
                )}
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Submit to AI
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Confirmation Required
            </DialogTitle>
            <DialogDescription>
              Please review and confirm the action before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          {confirmationData && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  {confirmationData.type === 'category' ? '📁 Category Action' : '📝 Question Upload'}
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  <strong>Action:</strong> {confirmationData.action}
                </p>
                {confirmationData.details && (
                  <div className="bg-white rounded p-3 text-sm space-y-1">
                    {Object.entries(confirmationData.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600">
                Are you sure you want to proceed with this action? This cannot be undone.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Confirm & Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>🤖 AI Command:</strong> Describe the exam you want to create (e.g., &quot;Create DSSSB exam with 100 questions&quot;)
          </div>
          <div>
            <strong>📁 Upload File:</strong> Upload PDF, TXT, Markdown, or JSON files containing questions
          </div>
          <div>
            <strong>📋 Copy/Paste:</strong> Paste questions directly from any source
          </div>
          <div>
            <strong>🖼️ Image/PDF:</strong> Upload scanned papers or screenshots (AI will extract text)
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-3">
            <strong className="text-purple-900">⚡ Smart Parser (NEW!):</strong> 
            <span className="text-purple-800"> 100% reliable AI-free parsing for structured exam papers. Perfect for KVS, UPSC, SSC formats with numbered questions and answer keys. No JSON errors, guaranteed success!</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
