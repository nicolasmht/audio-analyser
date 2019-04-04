class AudioAnalyser {

    constructor() {

        // Ajax
        this.request = new XMLHttpRequest();

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.source = 0;

        this.datasFrequency = new Float32Array(2048);
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

}