$( document ).ready(function() {
    //variables that will let us save recorded audio
    var userMedia = ""
    var mediaRecorder = ""
    var audioChunks = []

    //variables for audio visualizer
    "use strict";
    var paths = document.getElementsByTagName('path');
    var visualizer = document.getElementById('visualizer');
    var mask = visualizer.getElementById('mask');
    var h = document.getElementsByTagName('h1')[0];
    var path;
    var report = 0;
    
    var soundDesired = function (stream) {
        //Audio stops listening in FF without // window.persistAudioStream = stream;
        //https://bugzilla.mozilla.org/show_bug.cgi?id=965483
        //https://support.mozilla.org/en-US/questions/984179
        window.persistAudioStream = stream;
        var audioContent = new AudioContext();
        var audioStream = audioContent.createMediaStreamSource( stream );
        var analyser = audioContent.createAnalyser();
        audioStream.connect(analyser);
        analyser.fftSize = 1024;

        var frequencyArray = new Uint8Array(analyser.frequencyBinCount);
        visualizer.setAttribute('viewBox', '0 0 255 255');
      
        //Through the frequencyArray has a length longer than 255, there seems to be no
        //significant data after this point. Not worth visualizing.
        for (var i = 0 ; i < 255; i++) {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('stroke-dasharray', '4,1');
            mask.appendChild(path);
        }
        var doDraw = function () {
            requestAnimationFrame(doDraw);
            analyser.getByteFrequencyData(frequencyArray);
          	var adjustedLength;
            for (var i = 0 ; i < 255; i++) {
              	adjustedLength = Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 5);
                paths[i].setAttribute('d', 'M '+ (i) +',255 l 0,-' + adjustedLength);
            }

        }
        doDraw();
    }

    var soundNotAllowed = function (error) {
        h.innerHTML = "You must allow your microphone.";
        console.log(error);
    }

    /*window.navigator = window.navigator || {};
    /*navigator.getUserMedia =  navigator.getUserMedia       ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia    ||
                              null;*/
    navigator.getUserMedia({audio:true}, soundDesired, soundNotAllowed)

    navigator.mediaDevices.getUserMedia({audio:true}).then((stream) => {
        //create a recorder that is available for manuipulation
        mediaRecorder = new MediaRecorder(stream)

        mediaRecorder.ondataavailable = function (event){
            audioChunks.push(event.data)
        }
    })

    var recordAudio = $("#recordAudio")
    var recording = false

    $(recordAudio).on("click", function(){
        console.log("recording " + recording)
        var start = "fa-microphone"
        var stop = "fa-microphone-slash"
        $(this).find("i").removeClass(((recording) ? stop : start))
        $(this).find("i").addClass(((recording) ? start : stop))
        recording = !recording

        //start recording
        if(recording) mediaRecorder.start()
        else{ //stop recording
            mediaRecorder.stop()

            //audio chunk conversion
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' })
            const audioUrl = URL.createObjectURL(audioBlob)
            const audio = new Audio(audioUrl)

            console.log(audioUrl)

            //link hacking to save the file
            var a = document.createElement('a')
            document.body.appendChild(a)
            a.style = 'display: none'
            a.href = audioUrl
            a.download = 'test.mp3'
            a.click()
            a.remove()
        }
    })
})