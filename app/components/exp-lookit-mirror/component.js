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
            zIndex: '9999',
            backgroundColor: 'black'
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
            transform: 'scaleX(-1)'
        });

        mirrorContainer.appendChild(mirrorVideo);
        recorderContainer.insertBefore(mirrorContainer, recorderContainer.firstChild);
        console.log('[MirrorFrame] Mirror video element injected');

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log('[MirrorFrame] Camera stream obtained');
                mirrorVideo.srcObject = stream;
                mirrorVideo.play()
                    .then(() => console.log('[MirrorFrame] Mirror video playing'))
                    .catch(e => console.error('[MirrorFrame] Error playing mirror video:', e));
            })
            .catch(err => {
                console.error('[MirrorFrame] Error accessing camera:', err);
                mirrorContainer.remove();
            });
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

    frameSchemaProperties: {
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display'
        }
    }
});
