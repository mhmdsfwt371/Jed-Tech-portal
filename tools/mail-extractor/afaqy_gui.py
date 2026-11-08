"""AFAQY Mail Extractor — the window (English only: Tk does not shape Arabic reliably on every Windows set-up). Choose the PST, the period and Start; the file for the portal is written next to it.
Everything runs on this computer."""
import datetime as dt, os, queue, subprocess, sys, threading, tkinter as tk
from tkinter import filedialog, messagebox, ttk
import afaqy_extract as X

def last_month():
    t = dt.date.today().replace(day=1); e = t - dt.timedelta(days=1); return e.replace(day=1).isoformat(), e.isoformat()

class App(tk.Tk):
    def __init__(self):
        super().__init__(); self.title(f'AFAQY Mail Extractor {X.VERSION}'); self.geometry('620x420'); self.resizable(False, False)
        self.q, self.worker = queue.Queue(), None
        f0, f1 = last_month(); self.pst, self.dfrom, self.dto, self.scope = tk.StringVar(), tk.StringVar(value=f0), tk.StringVar(value=f1), tk.StringVar(value='inbox')
        pad = {'padx': 12, 'pady': 6}
        ttk.Label(self, text='1. Outlook mail file (.pst / .ost)', font=('Segoe UI', 10, 'bold')).pack(anchor='w', **pad)
        r = ttk.Frame(self); r.pack(fill='x', padx=12); ttk.Entry(r, textvariable=self.pst, width=56).pack(side='left'); ttk.Button(r, text='Choose…', command=self.pick).pack(side='left', padx=6)
        ttk.Label(self, text='2. Period, by received date (YYYY-MM-DD)', font=('Segoe UI', 10, 'bold')).pack(anchor='w', **pad)
        r = ttk.Frame(self); r.pack(fill='x', padx=12)
        for lbl, v in (('From', self.dfrom), ('To', self.dto)): ttk.Label(r, text=lbl).pack(side='left'); ttk.Entry(r, textvariable=v, width=12).pack(side='left', padx=(4, 16))
        ttk.Label(self, text='3. Folders', font=('Segoe UI', 10, 'bold')).pack(anchor='w', **pad)
        r = ttk.Frame(self); r.pack(fill='x', padx=12)
        ttk.Radiobutton(r, text='Inbox and its subfolders (recommended)', value='inbox', variable=self.scope).pack(anchor='w')
        ttk.Radiobutton(r, text='Every mail folder except Sent, Deleted, Drafts, Junk', value='all', variable=self.scope).pack(anchor='w')
        self.go = ttk.Button(self, text='Start', command=self.start); self.go.pack(pady=10)
        self.bar = ttk.Progressbar(self, mode='indeterminate', length=580); self.bar.pack(padx=12)
        self.status = tk.StringVar(value='Nothing leaves this computer. Bodies and attachments are never opened.'); ttk.Label(self, textvariable=self.status, wraplength=590, justify='left').pack(anchor='w', **pad)
        ttk.Label(self, text='Powered by Mohamed Safwat — idea, design & build', foreground='#5C6B78').pack(side='bottom', pady=6)
        self.after(200, self.poll)
    def pick(self):
        p = filedialog.askopenfilename(title='Outlook mail file', filetypes=[('Outlook data file', '*.pst *.ost'), ('All files', '*.*')])
        if p: self.pst.set(p)
    def start(self):
        p = self.pst.get().strip()
        if not os.path.isfile(p): messagebox.showerror('AFAQY Mail Extractor', 'Choose the .pst file first.'); return
        for v in (self.dfrom.get(), self.dto.get()):
            try: dt.date.fromisoformat(v)
            except ValueError: messagebox.showerror('AFAQY Mail Extractor', f'Date «{v}» is not YYYY-MM-DD.'); return
        base = os.path.splitext(os.path.basename(p))[0]; self.out = os.path.join(os.path.dirname(p), f'{base}-mail-activity-{self.dfrom.get()}_{self.dto.get()}.jsonl.gz')
        resuming = os.path.exists(self.out + '.checkpoint.json')
        self.go.state(['disabled']); self.bar.start(12); self.status.set('Resuming where it stopped…' if resuming else 'Reading…')
        def work():
            try: self.q.put(('done', X.run(p, self.out, self.dfrom.get(), self.dto.get(), self.scope.get(), progress=lambda s: self.q.put(('p', s)))))
            except Exception as e: self.q.put(('err', e))
        self.worker = threading.Thread(target=work, daemon=True); self.worker.start()
    def poll(self):
        try:
            while True:
                kind, v = self.q.get_nowait()
                if kind == 'p': self.status.set(f"Read {v['read']:,} · kept {v['kept']:,} · duplicates {v['dup']:,} · errors {v['errors']:,} · {v['seconds']}s · memory {v['peak_mb']} MB\n{v['folder']}")
                elif kind == 'done':
                    self.bar.stop(); self.go.state(['!disabled']); c = v['counts']
                    self.status.set(f"Done in {v['seconds']}s (peak memory {v['peak_mb']} MB): kept {c['kept']:,} of {c['read']:,} read · duplicates {c['dup']:,} · outside the period {c['out_of_range']:,} · errors {c['errors']:,}.\nFile: {self.out}\nImport it in the portal: Mail activity → Import the extractor's file.")
                    if sys.platform == 'win32': subprocess.Popen(['explorer', '/select,', self.out])
                elif kind == 'err':
                    self.bar.stop(); self.go.state(['!disabled']); self.status.set(f'Stopped: {v}\nStart again with the same file and period to resume where it stopped.')
        except queue.Empty: pass
        self.after(250, self.poll)
if __name__ == '__main__': App().mainloop()
