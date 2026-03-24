import React, { useState } from 'react';
import { P2PManager } from '../network/P2PManager';
import '../styles/P2PConnection.css';

interface P2PConnectionProps {
  onConnected: (p2pManager: P2PManager) => void;
}

const P2PConnection: React.FC<P2PConnectionProps> = ({ onConnected }) => {
  const [isInitiator, setIsInitiator] = useState(false);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [remoteOffer, setRemoteOffer] = useState<string>('');
  const [p2pManager] = useState(() => new P2PManager());

  const handleCreateGame = async () => {
    setIsInitiator(true);
    const gameOffer = await p2pManager.createOffer();
    setOffer(gameOffer);
  };

  const handleJoinGame = async () => {
    if (!remoteOffer) return;
    const remoteOfferObj = JSON.parse(remoteOffer);
    await p2pManager.acceptOffer(remoteOfferObj);
    const gameAnswer = await p2pManager.acceptOffer(remoteOfferObj);
    setAnswer(JSON.stringify(gameAnswer));
  };

  const handleAnswerReceived = async () => {
    if (!answer) return;
    const answerObj = JSON.parse(answer);
    await p2pManager.addAnswer(answerObj);
    onConnected(p2pManager);
  };

  return (
    <div className="p2p-connection">
      <h2>Online Chess - P2P Connection</h2>

      {!isInitiator ? (
        <div className="initiator-section">
          <button onClick={handleCreateGame} className="btn btn-primary">
            Create Game
          </button>
          {offer && (
            <div className="offer-section">
              <h4>Share this code with your opponent:</h4>
              <textarea
                readOnly
                value={JSON.stringify(offer)}
                className="offer-text"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(offer));
                  alert('Copied to clipboard!');
                }}
                className="btn btn-secondary"
              >
                Copy Code
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="joiner-section">
          <h4>Paste opponent's code:</h4>
          <textarea
            value={remoteOffer}
            onChange={(e) => setRemoteOffer(e.target.value)}
            className="offer-input"
            placeholder="Paste the code here"
          />
          <button onClick={handleJoinGame} className="btn btn-primary">
            Join Game
          </button>
          {answer && (
            <div className="answer-section">
              <h4>Share this code with opponent:</h4>
              <textarea readOnly value={answer} className="answer-text" />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer);
                  alert('Copied to clipboard!');
                }}
                className="btn btn-secondary"
              >
                Copy Code
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default P2PConnection;