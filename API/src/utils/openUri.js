import { exec } from 'child_process';

export function openUri(uri) {
    return new Promise((resolve, reject) => {
        if (!uri || typeof uri !== 'string') return reject(new Error('URI obrigatório'));

        const platform = process.platform;
        // proteger aspas internas
        const safe = uri.replace(/"/g, '\\"');

        let cmd;
        if (platform === 'win32') {
            // usa cmd /c start "" "uri" — start é built-in do cmd
            cmd = `cmd /c start "" "${safe}"`;
        } else if (platform === 'darwin') {
            cmd = `open "${safe}"`;
        } else {
            // linux/unix
            cmd = `xdg-open "${safe}"`;
        }

        exec(cmd, (err /*, stdout, stderr */) => {
            if (err) return reject(err);
            resolve(true);
        });
    });
}
