import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import Ember from 'ember';

/**
 * A frame that extends exp-lookit-webcam-display but adds fullscreen mirrored camera and background music
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    type: 'exp-lookit-mirror',

    musicPlaying: false,
    audioPlayer: null,

    didInsertElement() {
        this._super(...arguments);
        console.log('[MirrorFrame] didInsertElement triggered');

        // Remove white borders by enforcing full-bleed layout
        const container = document.querySelector('.exp-lookit-mirror');
        if (container) {
            Object.assign(container.style, {
                margin: '0',
                padding: '0',
                overflow: 'hidden',
                width: '100vw',
                height: '100vh',
            });
        }

        this._injectMirror();
        this._setupAudio();
    },

    willDestroyElement() {
        this._super(...arguments);
        console.log('[MirrorFrame] willDestroyElement triggered');

        this._stopAudio();

        const mirrorElem = document.getElementById('direct-mirror-container');
        if (mirrorElem) {
            console.log('[MirrorFrame] Removing mirror container');
            mirrorElem.remove();
        } else {
            console.warn('[MirrorFrame] No mirror container found to remove');
        }
    },

    _injectMirror(retries = 5) {
        console.log(`[MirrorFrame] Attempting to inject mirror, retries left: ${retries}`);
        const recorderContainer = document.querySelector('.recorder-container');
        if (!recorderContainer) {
            console.warn('[MirrorFrame] Recorder container not found');
            if (retries > 0) {
                setTimeout(() => this._injectMirror(retries - 1), 200);
            } else {
                console.error('[MirrorFrame] Failed to find recorder container after retries');
            }
            return;
        }

        console.log('[MirrorFrame] Recorder container found');

        const mirrorContainer = document.createElement('div');
        mirrorContainer.id = 'direct-mirror-container';
        Object.assign(mirrorContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            margin: '0',
            padding: '0',
            overflow: 'hidden'
        });

        const mirrorVideo = document.createElement('video');
        mirrorVideo.id = 'direct-mirror-video';
        mirrorVideo.autoplay = true;
        mirrorVideo.muted = true;
        mirrorVideo.playsInline = true;
        Object.assign(mirrorVideo.style, {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: 'block',
            margin: '0',
            padding: '0'
        });

        mirrorContainer.appendChild(mirrorVideo);
        recorderContainer.insertBefore(mirrorContainer, recorderContainer.firstChild);
        console.log('[MirrorFrame] Mirror video element injected');

        const sessionRecorder = this.get('sessionRecorder');

        if (sessionRecorder && sessionRecorder.stream) {
            console.log('[MirrorFrame] Using sessionRecorder stream');
            mirrorVideo.srcObject = sessionRecorder.stream;
            mirrorVideo.play().then(() => {
                console.log('[MirrorFrame] Mirror video playing from existing stream');
            }).catch(e => {
                console.error('[MirrorFrame] Error playing video from sessionRecorder stream:', e);
            });
        } else {
            console.warn('[MirrorFrame] sessionRecorder stream not found. Trying direct getUserMedia.');
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    mirrorVideo.srcObject = stream;
                    mirrorVideo.play()
                        .then(() => console.log('[MirrorFrame] Mirror video playing from direct stream'))
                        .catch(e => console.error('[MirrorFrame] Error playing direct mirror video:', e));
                })
                .catch(err => {
                    console.error('[MirrorFrame] Failed to get camera stream:', err);
                    mirrorContainer.remove();
                });
        }
    },

    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            console.log('[MirrorFrame] Setting up audio with URL:', songUrl);
            this.audioPlayer = new Audio(songUrl);
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = 0.7;
            this.audioPlayer.play()
                .then(() => console.log('[MirrorFrame] Audio started successfully'))
                .catch(e => console.error('[MirrorFrame] Audio play error:', e));
        } else {
            console.log('[MirrorFrame] No songUrl provided; skipping audio setup');
        }
    },

    _stopAudio() {
        if (this.audioPlayer) {
            console.log('[MirrorFrame] Stopping and cleaning up audio');
            this.audioPlayer.pause();
            this.audioPlayer = null;
        } else {
            console.log('[MirrorFrame] No audio player to stop');
        }
    },

    actions: {
        proceed() {
            console.log('[MirrorFrame] Proceed button clicked');
            this.stopRecorder().finally(() => {
                this.destroyRecorder();
                this.send('next');
            });
        }
    },

    frameSchemaProperties: {
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display'
        },
        nextButtonText: {
            type: 'string',
            default: 'Next',
            description: 'Text to display on the Next button'
        },
        showPreviousButton: {
            type: 'boolean',
            default: false,
            description: 'Whether to show a previous button'
        }
    }
});
