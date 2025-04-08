import ExpFrameBaseComponent from '../exp-frame-base/component';
import VideoRecord from '../../mixins/video-record';
import FullScreen from '../../mixins/full-screen';
import layout from './template';
import Ember from 'ember';

export default ExpFrameBaseComponent.extend(VideoRecord, FullScreen, {
    type: 'exp-mirror-display',
    layout: layout,
    
    // This is important! It tells VideoRecord which element to attach the recorder to
    recorderElement: '#recorder',
    doUseCamera: true,
    
    // Internal properties for the component
    timeRemaining: null,
    timerStarted: false,
    timerInterval: null,
    audioPlayer: null,
    showExitConfirmation: false,
    
    // Properties for display
    formattedTimeRemaining: Ember.computed('timeRemaining', function() {
        const minutes = Math.floor(this.get('timeRemaining') / 60);
        const seconds = this.get('timeRemaining') % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }),
    
    init() {
        this._super(...arguments);
        
        // Initialize time from duration property
        this.set('timeRemaining', this.get('duration'));
    },
    
    didInsertElement() {
        this._super(...arguments);
        
        console.log('EXP-MIRROR-DISPLAY: didInsertElement');
        
        // Setup keyboard listener for early exit
        this._setupKeyListener();
        
        // Start in fullscreen if requested
        if (this.get('displayFullscreen') || this.get('displayFullscreenOverride')) {
            this.set('isFullscreen', true);
            this._setupFullscreen();
        }
        
        // Start timer and audio
        this._startTimer();
        this._setupAudio();
    },
    
    willDestroyElement() {
        this._super(...arguments);
        
        console.log('EXP-MIRROR-DISPLAY: willDestroyElement');
        
        // Clean up
        this._stopTimer();
        this._stopAudio();
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this._boundKeyHandler);
    },
    
    // Private methods
    _setupKeyListener() {
        this._boundKeyHandler = this._handleKeyPress.bind(this);
        document.addEventListener('keydown', this._boundKeyHandler);
    },
    
    _handleKeyPress(e) {
        // Check for 'e' key to exit
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            this.set('showExitConfirmation', true);
        }
    },
    
    _startTimer() {
        if (!this.get('timerStarted')) {
            this.set('timerStarted', true);
            this.timerInterval = setInterval(() => {
                const timeRemaining = this.get('timeRemaining');
                if (timeRemaining <= 0) {
                    this._stopTimer();
                    this._finishTrial();
                } else {
                    this.set('timeRemaining', timeRemaining - 1);
                }
            }, 1000);
        }
    },
    
    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            console.log('Setting up audio with URL:', songUrl);
            this.audioPlayer = new Audio(songUrl);
            this.audioPlayer.loop = true;
            this.audioPlayer.play().catch(e => console.error("Audio error:", e));
        }
    },
    
    _stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
    },
    
    _finishTrial() {
        this._stopTimer();
        this._stopAudio();
        
        // Calculate actual duration viewed
        const completedDuration = this.get('duration') - this.get('timeRemaining');
        this.set('completedDuration', completedDuration);
        
        this._exitFullscreen();
        this.send('proceed');
    },
    
    // Frame schema properties
    frameSchemaProperties: {
        /**
         * Duration of the mirror display in seconds
         *
         * @property {Number} duration
         * @default 180
         */
        duration: {
            type: 'number',
            default: 180,
            description: 'Duration of the mirror display in seconds'
        },
        
        /**
         * URL for the background music
         *
         * @property {String} songUrl
         * @default https://github.com/sociallearninglab/baby_view_baby/raw/refs/heads/main/mp3/song.mp3
         */
        songUrl: {
            type: 'string',
            default: 'https://github.com/sociallearninglab/baby_view_baby/raw/refs/heads/main/mp3/song.mp3',
            description: 'URL for the background music'
        },
        
        /**
         * Whether to display this frame in fullscreen mode
         *
         * @property {Boolean} displayFullscreen
         * @default true
         */
        displayFullscreen: {
            type: 'boolean',
            default: true,
            description: 'Whether to display this frame in fullscreen mode'
        },
        
        /**
         * Text to display at the bottom of the mirror display
         *
         * @property {String} instructionText
         * @default Look who it is!
         */
        instructionText: {
            type: 'string',
            default: 'Look who it is!',
            description: 'Text to display at the bottom of the mirror display'
        }
    },
    
    meta: {
        name: 'Mirror Display',
        description: 'A frame that displays the webcam feed to the child, effectively functioning as a mirror.',
        data: {
            type: 'object',
            properties: {
                videoId: {
                    type: 'string'
                },
                videoList: {
                    type: 'list'
                },
                completedDuration: {
                    type: 'number'
                }
            },
            required: ['videoId']
        }
    },
    
    // Actions
    actions: {
        // Handle early exit confirmation
        confirmExit() {
            this.set('showExitConfirmation', false);
            this._finishTrial();
        },
        
        cancelExit() {
            this.set('showExitConfirmation', false);
        },
        
        // Important: Follow the same pattern as the original webcam-display
        proceed() {
            this.stopRecorder().finally(() => {
                this.destroyRecorder();
                this.send('next');
            });
        }
    }
});