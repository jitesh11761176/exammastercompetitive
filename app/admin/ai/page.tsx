'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AiAdminPage() {
  const [command, setCommand] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!command && !file) {
      toast.error('Please enter a command or upload a file.');
      return;
    }
    setIsLoading(true);
    toast.info('Processing request...');

    const formData = new FormData();
    if (command) {
      formData.append('command', command);
    }
    if (file) {
      formData.append('file', file);
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

      // Display success message with details
      if (result.data.examStructure) {
        toast.success(`Exam "${result.data.examStructure.examName}" created successfully with ${result.data.examStructure.totalQuestions} questions!`);
      }
      
      if (result.data.questions) {
        toast.success(`Successfully extracted and saved ${result.data.questions.savedCount} questions from the file!`);
      }

      setCommand('');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      toast.error('Failed to process AI task.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Uploader</CardTitle>
          <CardDescription>
            Use AI to generate exams or upload questions from a file.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="command">Create Exam Command</Label>
              <Textarea
                id="command"
                placeholder="e.g., 'Create a new exam for DSSSB with 20 questions about General Knowledge.'"
                value={command}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommand(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Upload Questions File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                accept=".pdf,.txt,.md,.json"
              />
              {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Submit to AI'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
