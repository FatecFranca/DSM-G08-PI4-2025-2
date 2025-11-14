export function parseKV(content) {
    if (!content || typeof content !== 'string') return {};

    try {
        const tokens = content.replace(/\r\n/g, '\n');
        const regex = /"([^\\"]*)"|{|}/g;
        let m;
        const stack = [{}];
        let key = null;

        while ((m = regex.exec(tokens)) !== null) {
            const t = m[0];
            if (t === '{') {
                const obj = {};
                if (key !== null) {
                    stack[stack.length - 1][key] = obj;
                    key = null;
                }
                stack.push(obj);
            } else if (t === '}') {
                stack.pop();
            } else {
                const val = m[1];
                if (key === null) {
                    key = val;
                } else {
                    stack[stack.length - 1][key] = val;
                    key = null;
                }
            }
        }

        return stack[0] || {};
    } catch (err) {
        return {};
    }
}