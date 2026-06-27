const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove initial localStorage state for quests and notes, keep it empty array.
code = code.replace(/const \[quests, setQuests\] = useState<Quest\[\]>\(\(\) => \{[\s\S]*?return SEED_QUESTS;\s*\}\);/, 'const [quests, setQuests] = useState<Quest[]>([]);');
code = code.replace(/const \[notes, setNotes\] = useState<NoteBlock\[\]>\(\(\) => \{[\s\S]*?return \[\];\s*\}\);/, 'const [notes, setNotes] = useState<NoteBlock[]>([]);');

// 2. Add useEffect to fetch quests and notes when authUser changes
const fetchEffect = `
  useEffect(() => {
    if (authUser) {
      authFetch("/api/quests").then(res => {
        if (res.quests) setQuests(res.quests);
      }).catch(e => console.error(e));
      
      authFetch("/api/user_notes").then(res => {
        if (res.notes) setNotes(res.notes);
      }).catch(e => console.error(e));
    }
  }, [authUser]);
`;
// Insert after notes declaration
code = code.replace(/const \[notes, setNotes\] = useState<NoteBlock\[\]>\(\[\]\);/, 'const [notes, setNotes] = useState<NoteBlock[]>([]);' + fetchEffect);

fs.writeFileSync('src/App.tsx', code);
