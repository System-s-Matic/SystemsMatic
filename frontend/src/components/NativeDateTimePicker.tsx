"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  formatLocalDateTime,
  getCurrentGuadeloupeTime,
  getMaximumBookingDate,
} from "../lib/date-utils";
import dayjs from "dayjs";

interface NativeDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  error?: boolean;
}

export default function NativeDateTimePicker({
  value,
  onChange,
  className,
  error,
}: NativeDateTimePickerProps) {
  // États pour les inputs séparés
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Calculer la date minimale (demain) et maximale (1 mois)
  const minDate = useMemo(() => {
    const tomorrow = getCurrentGuadeloupeTime().add(1, "day");
    return tomorrow.format("YYYY-MM-DD");
  }, []);

  const maxDate = useMemo(() => {
    const oneMonthFromNow = getMaximumBookingDate();
    return oneMonthFromNow.format("YYYY-MM-DD");
  }, []);

  // Générer les créneaux horaires disponibles
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
        // Créer directement une Date JavaScript avec l'heure sélectionnée
        const localDate = new Date(
          parseInt(date.split("-")[0]),
          parseInt(date.split("-")[1]) - 1,
          parseInt(date.split("-")[2]),
          parseInt(time.split(":")[0]),
          parseInt(time.split(":")[1]),
          0,
          0
        );

        // Vérifier que la date est dans la plage autorisée
        const minBookingDate = getCurrentGuadeloupeTime().add(1, "day");
        const maxBookingDate = getMaximumBookingDate();

        const selectedDateTime = dayjs(localDate);

        if (selectedDateTime.isBefore(minBookingDate)) {
          setLocalError(
            "Les rendez-vous doivent être pris à partir du lendemain"
          );
          onChange(null);
          return;
        }

        if (selectedDateTime.isAfter(maxBookingDate)) {
          setLocalError(
            "Les rendez-vous ne peuvent pas être planifiés au-delà d'un mois"
          );
          onChange(null);
          return;
        }

        onChange(localDate);
        setLocalError(null);
      } else {
        setLocalError("La date et l'heure sont requises");
        onChange(null);
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

  // Synchroniser avec la valeur externe
  React.useEffect(() => {
    if (value) {
      // Convertir la date en heure locale de Guadeloupe en préservant les valeurs
      const year = value.getFullYear();
      const month = value.getMonth();
      const date = value.getDate();
      const hour = value.getHours();
      const minute = value.getMinutes();

      const guadeloupeTime = getCurrentGuadeloupeTime()
        .year(year)
        .month(month)
        .date(date)
        .hour(hour)
        .minute(minute)
        .second(0)
        .millisecond(0);

      setSelectedDate(guadeloupeTime.format("YYYY-MM-DD"));
      setSelectedTime(guadeloupeTime.format("HH:mm"));
    } else {
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [value]);

  return (
    <div
      className={`native-datetime-picker ${className || ""} ${
        error ? "error" : ""
      }`}
    >
      <div className="datetime-inputs">
        <div className="date-input-group">
          <label htmlFor="date-picker">Date :</label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
            className="date-input"
            required
          />
          <div className="date-constraints-info">
            Du {getCurrentGuadeloupeTime().add(1, "day").format("DD/MM/YYYY")}{" "}
            au {getMaximumBookingDate().format("DD/MM/YYYY")}
          </div>
        </div>

        <div className="time-input-group">
          <label htmlFor="time-picker">Heure :</label>
          <select
            id="time-picker"
            value={selectedTime}
            onChange={handleTimeChange}
            className="time-select"
            required
          >
            <option value="">Sélectionnez</option>
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
          Sélectionné :{" "}
          {formatLocalDateTime(value, "dddd DD MMMM YYYY à HH:mm")}
        </div>
      )}
      {localError && <p className="form-error">{localError}</p>}
    </div>
  );
}
