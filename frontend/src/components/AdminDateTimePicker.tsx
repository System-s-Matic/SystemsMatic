"use client";

import React, { useState, useCallback, useMemo } from "react";
import { getCurrentGuadeloupeTime } from "../lib/date-utils";

interface AdminDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export default function AdminDateTimePicker({
  value,
  onChange,
  onConfirm,
  onCancel,
  className = "",
}: AdminDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Calculer la date minimale (demain) et maximale (1 mois)
  const minDate = useMemo(() => {
    const tomorrow = getCurrentGuadeloupeTime().add(1, "day");
    return tomorrow.format("YYYY-MM-DD");
  }, []);

  const maxDate = useMemo(() => {
    const oneMonthFromNow = getCurrentGuadeloupeTime().add(1, "month");
    return oneMonthFromNow.format("YYYY-MM-DD");
  }, []);

  // Générer les créneaux horaires disponibles (8h-17h)
  const timeSlots = useMemo(() => {
    const slots = [];

    // Créneaux du matin (8h-12h)
    for (let hour = 8; hour < 12; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Créneaux de l'après-midi (14h-17h)
    for (let hour = 14; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    return slots;
  }, []);

  // Mettre à jour la valeur combinée quand date ou heure change
  const updateDateTime = useCallback(
    (date: string, time: string) => {
      if (date && time) {
        const combinedDateTime = `${date}T${time}:00.000`;
        onChange(combinedDateTime);
      } else {
        onChange("");
      }
    },
    [onChange]
  );

  // Gestionnaires d'événements
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setSelectedDate(newDate);
      updateDateTime(newDate, selectedTime);
    },
    [selectedTime, updateDateTime]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTime = e.target.value;
      setSelectedTime(newTime);
      updateDateTime(selectedDate, newTime);
    },
    [selectedDate, updateDateTime]
  );

  // Initialiser les valeurs si value est fournie
  React.useEffect(() => {
    if (value) {
      const dateTime = new Date(value);
      setSelectedDate(dateTime.toISOString().split("T")[0]);
      setSelectedTime(
        `${dateTime.getHours().toString().padStart(2, "0")}:${dateTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [value]);

  return (
    <div className={`admin-datetime-picker ${className}`}>
      <div className="datetime-inputs">
        <div className="date-input-group">
          <label htmlFor="admin-date">Date</label>
          <input
            type="date"
            id="admin-date"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
            className="date-input"
            required
          />
        </div>

        <div className="time-input-group">
          <label htmlFor="admin-time">Heure</label>
          <select
            id="admin-time"
            value={selectedTime}
            onChange={handleTimeChange}
            className="time-select"
            required
          >
            <option value="">Sélectionner une heure</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {value && (
        <div className="selected-datetime">
          Date sélectionnée : {new Date(value).toLocaleString("fr-FR")}
        </div>
      )}

      <div className="date-constraints-info">
        <p>Contraintes :</p>
        <ul>
          <li>Minimum 24h à l&apos;avance</li>
          <li>Créneaux disponibles : 8h-12h et 14h-17h (toutes les 30 min)</li>
          <li>Maximum 1 mois à l&apos;avance</li>
        </ul>
      </div>

      <div className="date-picker-actions">
        <button
          onClick={onConfirm}
          className="action-button confirm"
          disabled={!value}
        >
          Proposer
        </button>
        <button onClick={onCancel} className="action-button reject">
          Annuler
        </button>
      </div>
    </div>
  );
}
