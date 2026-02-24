import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import ResizableImage from 'tiptap-extension-resize-image';
import TextAlign from '@tiptap/extension-text-align';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    editorRef?: React.MutableRefObject<any>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder, editorRef }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            ResizableImage.configure({
                inline: true,
                allowBase64: true,
            } as any),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'listItem', 'taskItem'],
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'w-full bg-transparent border-none outline-none text-base sm:text-lg leading-relaxed text-slate-300 placeholder-slate-600 min-h-[20vh] focus:outline-none prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5',
                'data-placeholder': placeholder || 'Start typing...',
            },
        },
    });

    useEffect(() => {
        if (editorRef) {
            editorRef.current = editor;
        }
    }, [editor, editorRef]);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    return (
        <div className="rich-text-wrapper">
            <EditorContent editor={editor} />
        </div>
    );
};
