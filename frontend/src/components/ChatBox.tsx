"use client";

import { useState, useEffect, useRef } from "react";

interface DialogOption {
  text: string;
  next: string;
}

interface DialogStep {
  question?: string;
  options?: DialogOption[];
  answer?: string;
  next?: string;
}

interface Dialog {
  [key: string]: DialogStep;
}

interface Message {
  id: string;
  type: "user" | "assistant" | "user-options";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  options?: DialogOption[];
}

const dialog: Dialog = {
  start: {
    question:
      "Bonjour ! Je suis l'assistant virtuel de SystemsMatic. Comment puis-je vous aider aujourd'hui ?",
    options: [
      { text: "Quels sont vos horaires ?", next: "horaires" },
      { text: "Quels sont vos tarifs ?", next: "tarifs" },
      { text: "Comment vous contacter ?", next: "contact" },
      { text: "Autre question", next: "autre" },
    ],
  },
  horaires: {
    answer:
      "Nos horaires d'ouverture sont du lundi au vendredi de 8h à 18h. Nous sommes fermés le week-end, mais vous pouvez nous laisser un message et nous vous répondrons dès lundi matin !",
    next: "start",
  },
  tarifs: {
    answer:
      "Nos tarifs varient selon le type de service :\n• Diagnostic : 50€\n• Installation : 80-150€\n• Maintenance : 100-300€\n• Support technique : 60€/h\n\nVoulez-vous plus de détails sur un service spécifique ?",
    next: "start",
  },
  contact: {
    answer:
      "Vous pouvez nous contacter de plusieurs façons :\n• 📞 Téléphone : 01 23 45 67 89\n• 📧 Email : contact@systemsmatic.fr\n• 💬 Ce chat en direct\n• 📍 En agence : 123 Rue de la Tech, Paris\n\nNous répondons généralement dans l'heure !",
    next: "start",
  },
  autre: {
    answer:
      "Je suis là pour vous aider ! Vous pouvez me poser des questions sur nos services, nos tarifs, nos horaires, ou tout autre sujet lié à SystemsMatic. Que souhaitez-vous savoir ?",
    next: "start",
  },
};

export default function ChatBox() {
  const [step, setStep] = useState<string>("start");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const current = dialog[step];

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll automatique quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effet de frappe pour simuler une vraie conversation
  const typeMessage = (text: string, callback?: () => void) => {
    setIsTyping(true);
    setCurrentTypingMessage("");
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setCurrentTypingMessage(text.slice(0, index + 1));
        index++;
        // Scroll pendant la frappe pour suivre le texte
        scrollToBottom();
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 30); // Vitesse de frappe réaliste
  };

  // Initialiser avec le message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "1",
        type: "assistant",
        content: current.question || "",
        timestamp: new Date(),
      };

      // Ajouter les options comme un message séparé
      const optionsMessage: Message = {
        id: "2",
        type: "user-options",
        content: "",
        timestamp: new Date(),
        options: current.options,
      };

      setMessages([welcomeMessage, optionsMessage]);
    }
  }, [isOpen, current.question, current.options, messages.length]);

  const handleOptionClick = (option: DialogOption) => {
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: option.text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simuler un délai de "réflexion" de l'IA
    setTimeout(() => {
      const nextStep = dialog[option.next];
      if (nextStep?.answer) {
        // Ajouter un message de frappe
        const typingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: "",
          timestamp: new Date(),
          isTyping: true,
        };

        setMessages((prev) => [...prev, typingMessage]);

        // Simuler la frappe de la réponse
        setTimeout(() => {
          typeMessage(nextStep.answer!, () => {
            // Remplacer le message de frappe par la vraie réponse
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isTyping
                  ? { ...msg, content: nextStep.answer!, isTyping: false }
                  : msg
              )
            );

            // Retourner au menu principal après un délai
            setTimeout(() => {
              const nextDialog = dialog[nextStep.next || "start"];
              if (nextDialog?.options) {
                // Ajouter les nouvelles options comme un message
                const newOptionsMessage: Message = {
                  id: (Date.now() + 2).toString(),
                  type: "user-options",
                  content: "",
                  timestamp: new Date(),
                  options: nextDialog.options,
                };
                setMessages((prev) => [...prev, newOptionsMessage]);
              }
              setStep(nextStep.next || "start");
            }, 2000);
          });
        }, 1000); // Délai avant de commencer à taper
      }
    }, 800); // Délai de "réflexion"
  };

  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      setIsOpen(true);
      setIsClosing(false);
    }
  };

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setMessages([]);
      setStep("start");
    }, 300);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="chat-icon"
          onClick={toggleChat}
          aria-label="Ouvrir le chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className={`chatbox ${isClosing ? "chatbox--closing" : ""}`}>
          <div className="chatbox__header">
            <div className="chatbox__header-info">
              <div className="chatbox__avatar">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3>Assistant SystemsMatic</h3>
                <span className="chatbox__status">En ligne</span>
              </div>
            </div>
            <button
              className="chatbox__close-btn"
              onClick={closeChat}
              aria-label="Fermer le chat"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chatbox__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message message--${message.type}`}
              >
                {message.type === "assistant" && (
                  <div className="message__avatar">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
                {message.type === "user-options" && (
                  <div className="message__avatar">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
                <div className="message__content">
                  {message.type === "user-options" ? (
                    <div className="message__options">
                      {message.options?.map((opt, i) => (
                        <button
                          key={i}
                          className="message__option-btn"
                          onClick={() => handleOptionClick(opt)}
                          disabled={isTyping}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="message__bubble">
                      {message.isTyping ? (
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  )}
                  <span className="message__time">
                    {message.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {/* Élément invisible pour le scroll automatique */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </>
  );
}
