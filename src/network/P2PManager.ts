import { P2PMessage, Move } from '../types/chess.types';

export class P2PManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private isInitiator: boolean = false;

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection(): void {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      ],
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.onicecandidate = (event: RTCPeerCandidateEvent) => {
      if (event.candidate) {
        this.sendMessage('ice-candidate', event.candidate);
      }
    };

    this.peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
      this.setupDataChannel(event.channel);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'failed') {
        this.reconnect();
      }
    };
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.isInitiator = true;
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    this.dataChannel = this.peerConnection.createDataChannel('chess', {
      ordered: true,
    });

    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async acceptOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async addAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.messageCallbacks.forEach((callback) => callback({ type: 'connected' }));
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };

    this.dataChannel.onmessage = (event: MessageEvent) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        const callback = this.messageCallbacks.get(message.type);
        if (callback) {
          callback(message.payload);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.dataChannel.onerror = (error: RTCErrorEvent) => {
      console.error('Data channel error:', error);
    };
  }

  public sendMove(move: Move): void {
    this.sendMessage('move', move);
  }

  public sendChat(message: string): void {
    this.sendMessage('chat', { text: message, timestamp: Date.now() });
  }

  public sendDrawOffer(): void {
    this.sendMessage('draw', { offeredAt: Date.now() });
  }

  public sendResign(): void {
    this.sendMessage('resign', { resignedAt: Date.now() });
  }

  private sendMessage(type: string, payload: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not open');
      return;
    }

    const message: P2PMessage = {
      type: type as any,
      payload,
      timestamp: Date.now(),
    };

    this.dataChannel.send(JSON.stringify(message));
  }

  public onMove(callback: (move: Move) => void): void {
    this.messageCallbacks.set('move', callback);
  }

  public onChat(callback: (data: any) => void): void {
    this.messageCallbacks.set('chat', callback);
  }

  public onDrawOffer(callback: () => void): void {
    this.messageCallbacks.set('draw', callback);
  }

  public onResign(callback: () => void): void {
    this.messageCallbacks.set('resign', callback);
  }

  public onConnected(callback: () => void): void {
    this.messageCallbacks.set('connected', callback);
  }

  public disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }

  private reconnect(): void {
    this.disconnect();
    this.initializePeerConnection();
  }

  public getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }
}