import { useEffect, useState } from "react";
import ReactModal from "react-modal";
import "./StatsModal.css";

function StatsModal({ currentStreak, totalGuesses, bestStreak }) {
  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    ReactModal.setAppElement("#root");
  }, []);

  return (
    <>
      <button id="stats_btn" onClick={() => setIsOpen(true)}>
        ⭐ Stats
      </button>
      <ReactModal isOpen={modalIsOpen} onRequestClose={() => setIsOpen(false)}>
        <h3>Kind Wordle Stats</h3>
        <p>Current streak: {currentStreak}</p>
        <p>
          Guesses taken: {totalGuesses} / {(currentStreak || 1) * 6}
        </p>
        <p>Best streak: {bestStreak}</p>
        <button onClick={() => setIsOpen(false)} id="close_btn">
          Close
        </button>
      </ReactModal>
    </>
  );
}

export default StatsModal;
