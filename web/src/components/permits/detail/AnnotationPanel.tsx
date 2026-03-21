'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PermitAnnotation {
  id: string;
  workspace_id: string;
  permit_api_number: string;
  notes: string | null;
  tags: string[];
  custom_status: string | null;
  assignee_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AnnotationHistory {
  id: string;
  annotation_id: string;
  changed_by: string;
  changed_at: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
}

interface TagDefinition {
  id: string;
  workspace_id: string;
  tag_name: string;
  color_hex: string;
  created_by: string;
  created_at: string;
}

interface CustomStatus {
  id: string;
  workspace_id: string;
  status_name: string;
  color_hex: string;
  sort_order: number;
}

interface AnnotationPanelProps {
  permitApiNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onAnnotationUpdate?: (annotation: PermitAnnotation) => void;
}

export function AnnotationPanel({
  permitApiNumber,
  isOpen,
  onClose,
  onAnnotationUpdate
}: AnnotationPanelProps) {
  const [annotation, setAnnotation] = useState<PermitAnnotation | null>(null);
  const [history, setHistory] = useState<AnnotationHistory[]>([]);
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([]);
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customStatus, setCustomStatus] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  // Fetch annotation data
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch annotation
        const annotationRes = await fetch(`/api/v1/annotations/${permitApiNumber}`);
        if (!annotationRes.ok) {
          throw new Error('Failed to fetch annotation');
        }
        const annotationData = await annotationRes.json();
        setAnnotation(annotationData.annotation);

        // Set form values
        if (annotationData.annotation) {
          setNewNote(annotationData.annotation.notes || '');
          setSelectedTags(annotationData.annotation.tags || []);
          setCustomStatus(annotationData.annotation.custom_status);
        }

        // Fetch history
        const historyRes = await fetch(`/api/v1/annotations/${permitApiNumber}/history`);
        if (!historyRes.ok) {
          throw new Error('Failed to fetch annotation history');
        }
        const historyData = await historyRes.json();
        setHistory(historyData.history);

        // Fetch tag definitions
        const tagsRes = await fetch('/api/v1/workspace/tags');
        if (!tagsRes.ok) {
          throw new Error('Failed to fetch tag definitions');
        }
        const tagsData = await tagsRes.json();
        setTagDefinitions(tagsData.tags);

        // Fetch custom statuses
        const statusesRes = await fetch('/api/v1/workspace/statuses');
        if (!statusesRes.ok) {
          throw new Error('Failed to fetch custom statuses');
        }
        const statusesData = await statusesRes.json();
        setCustomStatuses(statusesData.statuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load annotation data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, permitApiNumber]);

  // Save annotation
  const saveAnnotation = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/v1/annotations/${permitApiNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: newNote || null,
          tags: selectedTags,
          custom_status: customStatus,
          assignee_user_id: null, // For now, we're not implementing assignees
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }

      const data = await response.json();
      setAnnotation(data.annotation);
      
      if (onAnnotationUpdate) {
        onAnnotationUpdate(data.annotation);
      }
      
      toast.success('Annotation saved successfully');
    } catch (err) {
      toast.error('Failed to save annotation');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Add a new tag
  const addTag = async () => {
    if (!newTag.trim()) return;

    try {
      // First, create the tag definition if it doesn't exist
      const tagExists = tagDefinitions.some(t => t.tag_name === newTag);
      
      if (!tagExists) {
        const response = await fetch('/api/v1/workspace/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tag_name: newTag,
            color_hex: '#6B7280', // Default gray color
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create tag');
        }

        const newTagDef = await response.json();
        setTagDefinitions(prev => [...prev, newTagDef.tag]);
      }

      // Add the tag to selected tags if not already there
      if (!selectedTags.includes(newTag)) {
        setSelectedTags(prev => [...prev, newTag]);
        setNewTag('');
      }
    } catch (err) {
      toast.error('Failed to add tag');
      console.error(err);
    }
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background overlay */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-6 bg-gray-50 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Permit Annotations</h2>
                    <div className="ml-3 h-7 flex items-center">
                      <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    API Number: {permitApiNumber}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 px-4 py-6 sm:px-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : error ? (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error loading annotation data</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="notes"
                            rows={6}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add your notes here..."
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tags
                        </label>
                        <div className="mt-2">
                          {/* Existing tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tagDefinitions.map((tagDef) => {
                              const isSelected = selectedTags.includes(tagDef.tag_name);
                              return (
                                <button
                                  key={tagDef.id}
                                  type="button"
                                  onClick={() => toggleTag(tagDef.tag_name)}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    isSelected
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {tagDef.tag_name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Add new tag */}
                          <div className="flex">
                            <input
                              type="text"
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Add new tag"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
                              onClick={addTag}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Status */}
                      <div>
                        <label htmlFor="custom-status" className="block text-sm font-medium text-gray-700">
                          Custom Status
                        </label>
                        <select
                          id="custom-status"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={customStatus || ''}
                          onChange={(e) => setCustomStatus(e.target.value || null)}
                        >
                          <option value="">No custom status</option>
                          {customStatuses.map((status) => (
                            <option key={status.id} value={status.status_name}>
                              {status.status_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* History */}
                      {history.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">History</h3>
                          <div className="mt-2 bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                            <ul className="space-y-3">
                              {history.map((entry) => (
                                <li key={entry.id} className="text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {entry.field_name.charAt(0).toUpperCase() + entry.field_name.slice(1)}
                                    </span>
                                    <span className="text-gray-500">
                                      {new Date(entry.changed_at).toLocaleString()}
                                    </span>
                                  </div>
                                  {entry.old_value !== entry.new_value && (
                                    <div className="mt-1 text-gray-600">
                                      {entry.old_value ? (
                                        <span>Changed from "{entry.old_value}" to "{entry.new_value}"</span>
                                      ) : (
                                        <span>Set to "{entry.new_value}"</span>
                                      )}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 py-4 flex justify-end space-x-3 sm:px-6">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={saveAnnotation}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}