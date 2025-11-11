import speech_recognition as speech_recog

def speech():
    # siapkan micnya
    mic = speech_recog.Microphone()
    # siapkan recordingnya
    recog = speech_recog.Recognizer()

    # lakukan recording
    with mic as audio_file:
        # hapus noisenya
        recog.adjust_for_ambient_noise(audio_file)
        # recording
        audio = recog.listen(audio_file)
        # transkripsi
        return recog.recognize_google(audio, language="en-EN")

if __name__ == "__main__":
    word = speech()
    print(word)