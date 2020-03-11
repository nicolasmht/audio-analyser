class AudioAnalyser {

    constructor() {

        // Ajax
        this.request = new XMLHttpRequest();

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.ctx.createAnalyser();

        // this.analyser.fftSize = 32;
        // this.analyser.fftSize = 64;
        // this.analyser.fftSize = 128;
        // this.analyser.fftSize = 256;
        // this.analyser.fftSize = 512;
        // this.analyser.fftSize = 1024;
        // this.analyser.fftSize = 2048;
        this.analyser.fftSize = 4096;
        // this.analyser.fftSize = 8192;
        // this.analyser.fftSize = 16384;
        // this.analyser.fftSize = 32768;

        this.source = 0;

        this.datasFrequency = new Float32Array( this.analyser.fftSize );
        this.datasBits = new Uint8Array( this.analyser.frequencyBinCount );

        this.averages = {
            'lowBass': 0,
            'bass': 0,
            'inferiorMedium': 0,
            'medium': 0,
            'superiorMedium': 0,
            'acute': 0,
            'superiorAcute': 0,
            'global': 0
        };
    }

    load(url) {

        let promiseStart = new Promise((resolve, reject) => {

            this.request.open('GET', url, true);
            this.request.responseType = 'arraybuffer';

            this.source = this.ctx.createBufferSource();
            
            // request.onload = () => {
            this.request.addEventListener('load', () => {

                let audioData = this.request.response;

                this.ctx.decodeAudioData(audioData, (buffer) => {
                    
                    // Get all informations of audio
                    this.source.buffer = buffer;
                    
                    // Connect audi to destination
                    this.source.connect(this.ctx.destination);
                    
                    // Connect the analyser
                    this.source.connect(this.analyser);

                    let getDatas = () => {

                        // Get datas of music
                        this.analyser.getByteFrequencyData(this.datasBits);

                        // 0 to 25 Hz
                        this.averages.lowBass = this.datasBits[0] / 255;

                        // 25 to 120 Hz
                        for (let i = 1; i <= 5; ++i) { this.averages.bass += this.datasBits[i]; }
                        this.averages.bass = (this.averages.bass / ( 255 * 5));

                        // 120 to 350 Hz
                        for (let i = 6; i <= 15; ++i) { this.averages.inferiorMedium += this.datasBits[i]; }
                        this.averages.inferiorMedium = (this.averages.inferiorMedium / ( 255 * 9));

                        // 350 to 2 KHz
                        for (let i = 16; i <= 85; ++i) { this.averages.medium += this.datasBits[i]; }
                        this.averages.medium = (this.averages.medium / ( 255 * 69));

                        // 2 KHz to 8 KHz
                        for (let i = 86; i <= 341; ++i) { this.averages.superiorMedium += this.datasBits[i]; }
                        this.averages.superiorMedium = (this.averages.superiorMedium / ( 255 * 255));

                        // 8 KHz to 12 KHz
                        for (let i = 342; i <= 512; ++i) { this.averages.acute += this.datasBits[i]; }
                        this.averages.acute = (this.averages.acute / ( 255 * 171));

                        // 12 KHz to 22 KHz
                        for (let i = 513; i <= 939; ++i) { this.averages.superiorAcute += this.datasBits[i]; }
                        this.averages.superiorAcute = (this.averages.superiorAcute / ( 255 * 427));

                        // Global Hz
                        for (let i = 0; i <= 1023; ++i) { this.averages.global += this.datasBits[i]; }
                        this.averages.global = (this.averages.global / ( 255 * 1023));

                        window.requestAnimationFrame(getDatas);
                    }

                    getDatas();

                    resolve(true);
                });
            });

            this.request.send();
        });

        return promiseStart;
    }

    start() {
        this.source.start(0);
    }

    stop() {
        this.source.stop(0);
    }

    getDuration() {
        return Math.round(this.source.buffer.duration);
    }

    setLoop(value = false) {
        this.source.loop = value;
    }

    getDatasAudio() {
        return this.averages;
    }

    previous() {
        let canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        canvas.style.position = "absolute";
        canvas.style.top = "0px";
        canvas.style.right = "0px";
        canvas.style.botom = "0px";
        canvas.style.left = "0px";
        canvas.style.background = "#000";

        document.querySelector('body').appendChild(canvas);

        let widthLine = (canvas.width - (7 * 50)) / 8,
            widthLineAverage = widthLine/2 + (canvas.width - (7 * 50)) / 8;
        
        function animation() {

            let dataAudios = audioAnalyser.getDatasAudio();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'red';
            ctx.fillRect(widthLine, canvas.height - dataAudios.lowBass * 200, 10, 200);
            
            ctx.fillRect(widthLine * 2, canvas.height - dataAudios.bass * 200, 10, 200);
            ctx.fillRect(widthLine * 3, canvas.height - dataAudios.inferiorMedium * 200, 10, 200);
            ctx.fillRect(widthLine * 4, canvas.height - dataAudios.medium * 200, 10, 200);
            ctx.fillRect(widthLine * 5, canvas.height - dataAudios.superiorMedium * 200, 10, 200);
            ctx.fillRect(widthLine * 6, canvas.height - dataAudios.acute * 200, 10, 200);
            ctx.fillRect(widthLine * 7, canvas.height - dataAudios.superiorAcute * 200, 10, 200);
            
            ctx.fillStyle = 'green';
            ctx.fillRect(widthLine * 8, canvas.height - dataAudios.global * 200, 10, 200);
            
            window.requestAnimationFrame(animation);
        }

        animation();
    }
}