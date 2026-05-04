import { useState, useEffect, useRef } from 'react';

interface Member { id: string; name: string; department?: string; }

interface TypeSearchProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'developer' | 'ba' | 'all';
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  onNewName?: (name: string) => void;
}

export const TypeSearch = ({
  value, onChange, type, placeholder,
  disabled = false, allowCustom = false, onNewName,
}: TypeSearchProps) => {
  const [query, setQuery] = useState(value || '');
  const [members, setMembers] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    const url = (!type || type === 'all') ? `${base}/members` : `${base}/members?type=${type}`;
    fetch(url)
      .then(r => r.json())
      .then((data: Member[]) => setMembers(data.map(m => m.name)))
      .catch(() => {});
  }, [type]);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const handleInput = (q: string) => {
    setQuery(q);
    setOpen(true);
    setFiltered(members.filter(m => m.toLowerCase().includes(q.toLowerCase())));
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      if (allowCustom && query && !members.includes(query)) {
        onChange(query);
        onNewName?.(query);
      } else if (!allowCustom && !members.includes(query)) {
        setQuery(value || '');
      }
    }, 200);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={e => {
          (e.target as HTMLInputElement).style.borderColor = 'var(--qa-accent)';
          setFiltered(members.filter(m => !query || m.toLowerCase().includes(query.toLowerCase())));
          setOpen(true);
        }}
        onBlur={e => {
          (e.target as HTMLInputElement).style.borderColor = 'var(--qa-border)';
          handleBlur();
        }}
        placeholder={placeholder || `Search ${type}...`}
        disabled={disabled}
        style={{
          width: '100%', background: 'var(--qa-input)',
          border: '1px solid var(--qa-border)', borderRadius: '8px',
          padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px', color: 'var(--qa-text)', outline: 'none',
          opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      />
      {open && (filtered.length > 0 || (allowCustom && query)) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '4px', background: 'var(--qa-modal)',
          border: '1px solid var(--qa-border)', borderRadius: '8px',
          boxShadow: 'var(--qa-shadow)', zIndex: 500,
          maxHeight: '200px', overflowY: 'auto',
        }}>
          {filtered.map(name => (
            <div key={name} onMouseDown={() => handleSelect(name)} style={{
              padding: '8px 12px', fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace", color: 'var(--qa-text)',
              cursor: 'pointer', borderBottom: '1px solid var(--qa-border-lt)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,106,247,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'none'}>
              {name}
            </div>
          ))}
          {allowCustom && query && !members.includes(query) && (
            <div onMouseDown={() => { handleSelect(query); onNewName?.(query); }}
              style={{
                padding: '8px 12px', fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace", color: 'var(--qa-accent)',
                cursor: 'pointer', borderTop: '1px solid var(--qa-border-lt)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,106,247,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'none'}>
              + Add "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
