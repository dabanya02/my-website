function interpretString() {
	let code = document.getElementById("BFCode").value;
	let input = document.getElementById("BFInput").value;
	let loops = [];
	let mem = [0];
	let ptr = 0;
	let result = "";
	let n = 0;
	for (let i = 0; i < code.length; i++) {
		switch (code.charAt(i)) {
			case '[':
				loops.push(i);
				break;
			case ']':
				let temp = loops.pop();
				if (mem[ptr] !== 0) {
					i = temp - 1;
				}
				break;
			case '+':
				mem[ptr]++;
				break;
			case '-':
				mem[ptr]--;
				break;
			case '>':
				ptr++;
				if (mem.length <= ptr)
					mem.push(0);
				break;
			case '<':
				if (ptr == 0) { alert("negative numbers not allowed"); break; }
				ptr--;
				break;
			case '.':
				result = result.concat(String.fromCharCode(mem[ptr]));
				break;
			case ',':
				mem[ptr] = input.charCodeAt(n);
				n++;
			default:
				break;
		}
	}
	document.getElementById("Output").textContent = result;
}
