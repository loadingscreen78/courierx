import { useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
}

export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  ...props 
}: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(String(value ?? ''));

  // Sync when value changes externally (not from typing)
  useEffect(() => {
    setLocalValue(String(value ?? ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (localValue !== String(value)) {
      onChange(localValue);
    }
  };

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});
DebouncedInput.displayName = 'DebouncedInput';

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const DebouncedTextarea = memo(({ 
  value, 
  onChange, 
  ...props 
}: DebouncedTextareaProps) => {
  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <Textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});
DebouncedTextarea.displayName = 'DebouncedTextarea';
