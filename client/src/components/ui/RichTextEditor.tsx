import React, { useEffect, useRef } from 'react';

// Deklarasikan Quill pada scope window agar TypeScript mengenalinya
declare global {
  interface Window {
    Quill: any;
  }
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// --- Konfigurasi Toolbar yang Diperluas ---
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

// --- Format yang Diizinkan (sesuaikan dengan toolbar) ---
const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'blockquote', 'code-block',
  'list', 'indent',
  'align',
  'link', 'image', 'video'
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null); // Untuk menyimpan instance Quill

  useEffect(() => {
    if (editorRef.current && window.Quill) {
      // Inisialisasi Quill hanya sekali
      if (!quillInstance.current) {
        quillInstance.current = new window.Quill(editorRef.current, {
          theme: 'snow',
          placeholder,
          modules: modules, // <-- Gunakan modules yang diperluas
          formats: formats,   // <-- Gunakan formats yang diperluas
        });

        // Listener untuk event 'text-change'
        quillInstance.current.on('text-change', () => {
          const editorContent = quillInstance.current.root.innerHTML;
          // Hindari update loop tak terbatas
          if (editorContent !== value) {
            onChange(editorContent);
          }
        });
      }

      // Sinkronkan value dari form ke editor jika berbeda
      // Cek ini penting untuk mencegah kursor melompat saat mengetik
      const currentContent = quillInstance.current.root.innerHTML;
      if (currentContent !== value && value !== '<p><br></p>') {
        quillInstance.current.clipboard.dangerouslyPasteHTML(value || '');
      } else if (!value && currentContent !== '<p><br></p>') {
        // Kosongkan editor jika value form kosong
        quillInstance.current.setText('');
      }
    }
  }, [value, onChange, placeholder]);

  return <div ref={editorRef} className={className} style={{ backgroundColor: 'white' }} />;
}