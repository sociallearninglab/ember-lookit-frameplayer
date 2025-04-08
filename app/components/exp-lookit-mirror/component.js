import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import Ember from 'ember';

/**
 * A frame that extends exp-lookit-webcam-display to add mirror functionality
 * and background music.
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    type: 'exp-lookit-mirror',
    
    // Internal properties
    musicPlaying: false,
    audioPlayer: null,
    
    didInsertElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: didInsertElement');
        
        // Add mirror effect with multiple attempts
        this._setupMirrorEffect();
        
        // Play background music
        this._setupAudio();
        
        // Apply direct recorder styling for maximum compatibility
        this._applyDirectStyles();
    },
    
    willDestroyElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: willDestroyElement');
        
        // Clean up audio
        this._stopAudio();
    },
    
    // Apply direct styles to ensure recorder is visible
    _applyDirectStyles() {
        // Apply styles to recorder container
        const recorderContainer = document.querySelector('.recorder-container');
        if (recorderContainer) {
            Object.assign(recorderContainer.style, {
                width: '100%',
                maxWidth: 'none',
                height: '100%'
            });
        }
        
        // Apply styles to recorder
        const recorder = document.getElementById('recorder');
        if (recorder) {
            Object.assign(recorder.style, {
                width: '100%',
                maxWidth: 'none',
                height: '100%',
                backgroundColor: 'black'
            });
        }
        
        // Apply styles to webcam row
        const webcamRow = document.querySelector('.webcam-row');
        if (webcamRow) {
            Object.assign(webcamRow.style, {
                height: '80vh',
                width: '100%',
                margin: '0'
            });
        }
    },
    
    // Setup mirror effect
    _setupMirrorEffect() {
        // Try repeatedly to find and mirror the video
        const attemptMirror = () => {
            const videoElements = document.querySelectorAll('#recorder video');
            console.log(`Found ${videoElements.length} video elements`);
            
            if (videoElements.length) {
                videoElements.forEach(video => {
                    // Apply mirror effect and ensure visibility
                    Object.assign(video.style, {
                        transform: 'scaleX(-1)',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    });
                    
                    console.log('Applied mirror effect to video');
                });
                return true;
            }
            return false;
        };
        
        // Try immediately
        if (!attemptMirror()) {
            // Try after a delay and set up additional attempts
            setTimeout(() => {
                attemptMirror();
                // Set up recurring attempts
                const interval = setInterval(() => {
                    if (attemptMirror()) {
                        clearInterval(interval);
                    }
                }, 500);
                
                // Stop trying after 10 seconds
                setTimeout(() => clearInterval(interval), 10000);
            }, 500);
        }
    },
    
    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            console.log('Setting up audio with URL:', songUrl);
            this.audioPlayer = new Audio(songUrl);
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = 0.7; // 70% volume
            this.audioPlayer.play().catch(e => console.error("Audio error:", e));
        }
    },
    
    _stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
    },
    
    // Add our custom properties to the schema
    frameSchemaProperties: {
        // Include all properties from parent
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        
        /**
         * URL for the background music
         *
         * @property {String} songUrl
         */
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display'
        }
    }
});