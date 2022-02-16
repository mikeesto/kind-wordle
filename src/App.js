import { useEffect, useState } from "react";
import { cloneDeep } from "lodash";
import useEventListener from "@use-it/event-listener";
import Confetti from "react-confetti";
import StatsModal from "./StatsModal";
import { getWord, allWords } from "./words";
import Keyboard from "./Keyboard";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState(
    Array.from({ length: 6 }, () =>
      Array.from({ length: 5 }, () => ({
        letter: "",
        state: null,
      }))
    )
  );

  const [answer, setAnswer] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [shakeRowIndex, setShakeRowIndex] = useState(-1);
  const [success, setSuccess] = useState(false);
  const [party, setParty] = useState(false);
  const [letterStates, setLetterStates] = useState({});

  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const showMessage = (msg, time = 1000) => {
    setMessage(msg);
    if (time > 0) {
      setTimeout(() => {
        setMessage("");
      }, time);
    }
  };

  const fillTile = (key) => {
    const currentRow = board[currentRowIndex];

    const letter = key.toLowerCase();

    if (/^[a-zA-Z]$/.test(key)) {
      for (const tile of currentRow) {
        if (!tile.letter) {
          tile.letter = letter;
          break;
        }
      }

      setBoard((prevBoard) => {
        const tempBoard = cloneDeep(prevBoard);
        tempBoard[currentRowIndex] = currentRow;
        return tempBoard;
      });
    }
  };

  const clearTile = () => {
    const currentRow = board[currentRowIndex];
    for (const tile of [...currentRow].reverse()) {
      if (tile.letter) {
        tile.letter = "";
        break;
      }
    }

    setBoard((prevBoard) => {
      const tempBoard = cloneDeep(prevBoard);
      tempBoard[currentRowIndex] = currentRow;
      return tempBoard;
    });
  };

  const completeRow = () => {
    const currentRow = board[currentRowIndex];
    if (currentRow.every((tile) => tile.letter)) {
      const guess = currentRow.map((tile) => tile.letter).join("");
      if (!allWords.includes(guess)) {
        shake();
        showMessage(`That's not a word!`);
        return;
      }

      const answerLetters = answer.split("");
      const tempLetterStates = { ...letterStates };

      // First pass: mark correct ones
      currentRow.forEach((tile, i) => {
        if (answerLetters[i] === tile.letter) {
          tile.state = "CORRECT";
          answerLetters[i] = null;

          tempLetterStates[tile.letter] = "CORRECT";
        }
      });

      // Second pass: mark the present
      currentRow.forEach((tile) => {
        if (!tile.state && answerLetters.includes(tile.letter)) {
          tile.state = "PRESENT";
          answerLetters[answerLetters.indexOf(tile.letter)] = null;

          if (!tempLetterStates[tile.letter]) {
            tempLetterStates[tile.letter] = "PRESENT";
          }
        }
      });

      // Third pass: mark the absent
      currentRow.forEach((tile) => {
        if (!tile.state) {
          tile.state = "ABSENT";
        }

        if (!tempLetterStates[tile.letter]) {
          tempLetterStates[tile.letter] = "ABSENT";
        }
      });

      setLetterStates(tempLetterStates);

      setBoard((prevBoard) => {
        const tempBoard = cloneDeep(prevBoard);
        tempBoard[currentRowIndex] = currentRow;
        return tempBoard;
      });

      // Check for win
      if (currentRow.every((tile) => tile.state === "CORRECT")) {
        setMessage("Awww yisss!");
        setSuccess(true);
        setParty(true);

        localStorage.setItem("totalGuesses", (totalGuesses + 1).toString());
        setTotalGuesses((guesses) => guesses + 1);

        localStorage.setItem("currentStreak", (currentStreak + 1).toString());

        if (currentStreak + 1 > bestStreak) {
          localStorage.setItem("bestStreak", (bestStreak + 1).toString());
          setBestStreak((streak) => streak + 1);
        }

        setCurrentStreak((streak) => streak + 1);
      } else {
        setMessage("");
        if (currentRowIndex >= 5) {
          setSuccess(true);
          setMessage("Better luck next time!");

          localStorage.setItem("currentStreak", "0");
          setCurrentStreak(0);
          localStorage.setItem("totalGuesses", "0");
          setTotalGuesses(0);
        } else {
          setCurrentRowIndex((count) => count + 1);

          localStorage.setItem("totalGuesses", (totalGuesses + 1).toString());
          setTotalGuesses((guesses) => guesses + 1);
        }
      }
    } else {
      shake();
      setMessage("Moar letters needed!");
    }
  };

  function shake() {
    setShakeRowIndex(currentRowIndex);
    setTimeout(() => {
      setShakeRowIndex(-1);
    }, 1000);
  }

  const onKey = (key) => {
    if (/^[a-zA-Z]$/.test(key)) {
      fillTile(key.toLowerCase());
    } else if (key === "Backspace") {
      clearTile();
    } else if (key === "Enter") {
      completeRow();
    }
  };

  const onKeyup = (e) => onKey(e.key);

  useEventListener("keyup", onKeyup);

  useEffect(() => {
    // Set size on startup
    window.addEventListener("resize", onResize);
    onResize();
    function onResize() {
      // Get actual vh on mobile
      document.body.style.setProperty("--vh", window.innerHeight + "px");
    }

    // Get answer and show vowels
    let answer = getWord();
    setAnswer(answer);

    const vowels = ["a", "e", "i", "o", "u"];

    vowels.forEach((vowel) => {
      if (answer.split("").includes(vowel)) {
        setLetterStates((state) => {
          state[vowel] = "PRESENT";
          return state;
        });
      }
    });

    // Set streak values from local storage
    setCurrentStreak(parseInt(localStorage.getItem("currentStreak")) || 0);
    setTotalGuesses(parseInt(localStorage.getItem("totalGuesses")) || 0);
    setBestStreak(parseInt(localStorage.getItem("bestStreak")) || 0);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <h1>❤️‍🩹 Kind Wordle</h1>
      <StatsModal
        currentStreak={currentStreak}
        totalGuesses={totalGuesses}
        bestStreak={bestStreak}
      />
      <p>{message}</p>
      <Confetti
        style={{ pointerEvents: "none" }}
        numberOfPieces={party ? 500 : 0}
        recycle={false}
        onConfettiComplete={(confetti) => {
          setParty(false);
          confetti.reset();
        }}
      />
      <div id="board">
        {board.map((row, index) => {
          return (
            <div
              className={`row ${shakeRowIndex === index && "shake"} ${
                success && currentRowIndex === index && "jump"
              }}`}
              key={index}
            >
              {row.map((tile, index) => {
                return (
                  <div
                    className={`tile ${tile.letter && "filled"} ${
                      tile.state && "revealed"
                    }`}
                    key={index}
                  >
                    <div
                      className="front"
                      style={{ transitionDelay: `${index * 300}ms` }}
                    >
                      {tile.letter}
                    </div>
                    <div
                      className={`back ${
                        tile.state && tile.state.toLowerCase()
                      }`}
                      style={{
                        transitionDelay: `${index * 300}ms`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {tile.letter}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {success && (
        <a href="/" className="play_again">
          Play again?
        </a>
      )}
      <Keyboard onKey={onKey} letterStates={letterStates} />
    </>
  );
}

export default App;
