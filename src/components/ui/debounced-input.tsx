import { useState, useEffect, useRef, memo } from 'react';
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
  const isFocused = useRef(false);

  // Only sync external value when the input is NOT focused (i.e. programmatic update)
  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(String(value ?? ''));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (localValue !== String(value)) {
      onChange(localValue);
    }
  };

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
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
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value ?? '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <Textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});
DebouncedTextarea.displayName = 'DebouncedTextarea';
