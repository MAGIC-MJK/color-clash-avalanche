export function createMusicVisualizer(audio, canvas) {
    const context = canvas.getContext('2d');
    if (!context) return { start: async () => {}, stop: () => {} };

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let audioContext;
    let analyser;
    let frequencies;
    let waveform;
    let frame;

    function paint(active = false) {
        if (active && analyser) {
            analyser.getByteFrequencyData(frequencies);
            analyser.getByteTimeDomainData(waveform);
        }
        context.clearRect(0, 0, width, height);
        context.fillStyle = '#06151a';
        context.fillRect(0, 0, width, height);
        context.strokeStyle = '#103038';
        context.lineWidth = 1;
        for (let x = 0; x < width; x += 10) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        const bass = active ? frequencies.slice(2, 15).reduce((sum, value) => sum + value, 0) / (13 * 255) : 0;
        canvas.parentElement.style.setProperty('--bass', bass.toFixed(2));
        const radius = 57 + bass * 13;
        context.lineCap = 'round';
        context.lineWidth = 2;
        context.strokeStyle = '#36dccc';
        context.shadowColor = '#3efce1';
        context.shadowBlur = 10;
        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const strength = active ? frequencies[3 + (i % 24) * 3] / 255 : 0;
            context.beginPath();
            context.moveTo(width / 2 + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
            context.lineTo(width / 2 + Math.cos(angle) * (radius + 8 + strength * 17), centerY + Math.sin(angle) * (radius + 8 + strength * 17));
            context.stroke();
        }

        const count = 56;
        context.strokeStyle = '#83ff40';
        context.shadowColor = '#72ff31';
        context.shadowBlur = 12;
        context.lineWidth = 3;
        for (let i = 0; i < count; i++) {
            const x = (i + .5) * width / count;
            const bin = 2 + Math.floor(Math.pow(i / count, 1.6) * 120);
            const energy = active ? frequencies[bin] / 255 : 0;
            const barHeight = 8 + energy * 170;
            context.beginPath();
            context.moveTo(x, centerY - barHeight / 2);
            context.lineTo(x, centerY + barHeight / 2);
            context.stroke();
        }

        if (active) {
            context.strokeStyle = '#58e8df';
            context.shadowColor = '#42f2e2';
            context.shadowBlur = 9;
            context.lineWidth = 2;
            context.beginPath();
            for (let i = 0; i < waveform.length; i++) {
                const x = i * width / (waveform.length - 1);
                const y = centerY + (waveform[i] - 128) * .42;
                if (i === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            }
            context.stroke();
        }
        context.shadowBlur = 0;
    }

    function animate() {
        paint(true);
        frame = requestAnimationFrame(animate);
    }

    paint();
    return {
        async start() {
            if (!audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                audioContext = new AudioContext();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = .78;
                frequencies = new Uint8Array(analyser.frequencyBinCount);
                waveform = new Uint8Array(analyser.fftSize);
                audioContext.createMediaElementSource(audio).connect(analyser);
                analyser.connect(audioContext.destination);
            }
            await audioContext.resume();
            if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(animate);
        },
        stop() {
            cancelAnimationFrame(frame);
            frame = null;
            paint();
        }
    };
}
