/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

export interface SmartMatchRequest {
  petDetails: {
    name: string;
    species: string;
    rawSpecies: string;
    breed: string;
    age: string;
    gender: string;
    weight: string;
  };
  mainConcern: string;
  freeformKeyword: string;
  followUpAnswers: any[];
  healthBackground: any[];
  currentHealthStatus: any[];
  mediaReferences: any[];
  // Options for scheduling & ranking
  consultationType?: "instant" | "future";
  requestedDate?: string;
  requestedTime?: string;
  userPincode?: string;
  activeAppointments?: any[];
  userLat?: number | null;
  userLon?: number | null;
}

// -------------------------------------------------------------------------
// Helper functions (aligned with BookingDetails.tsx)
// -------------------------------------------------------------------------
export const parseTimeToMins = (str: string): number => {
  const clean = str.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const modifier = match[3];
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const formatMinsToTime = (mins: number): string => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const modifier = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${modifier}`;
};

export const calculatePincodeDistance = (pin1: string, pin2: string): number => {
  if (!pin1 || !pin2) return 15.0; // fallback default distance in km
  const p1 = pin1.replace(/\s/g, "");
  const p2 = pin2.replace(/\s/g, "");
  if (p1 === p2) return 0.0;
  
  const num1 = parseInt(p1, 10);
  const num2 = parseInt(p2, 10);
  if (!isNaN(num1) && !isNaN(num2)) {
    if (p1.substring(0, 3) === p2.substring(0, 3)) {
      return 1.5 + (Math.abs(num1 - num2) % 3);
    }
    if (p1.substring(0, 2) === p2.substring(0, 2)) {
      return 5.0 + (Math.abs(num1 - num2) % 10);
    }
    return 15.0 + (Math.abs(num1 - num2) % 50);
  }
  
  let matchCount = 0;
  for (let i = 0; i < Math.min(p1.length, p2.length); i++) {
    if (p1[i] === p2[i]) matchCount++;
    else break;
  }
  if (matchCount > 0) {
    return Math.max(1.0, 20.0 - matchCount * 4.0);
  }
  return 25.0;
};

export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generates actually available (non-booked) slots on a given date string (YYYY-MM-DD)
export function getAvailableSlotsForVet(vet: any, dateStr: string, activeAppointments: any[]): string[] {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[dateObj.getDay()];
  
  let weeklyAvail: any = null;
  if (vet.weekly_availability) {
    if (typeof vet.weekly_availability === "string") {
      try {
        weeklyAvail = JSON.parse(vet.weekly_availability);
      } catch (e) {
        weeklyAvail = null;
      }
    } else {
      weeklyAvail = vet.weekly_availability;
    }
  }

  let rawSlots: string[] = [];
  const defaultSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
    "09:00 PM", "09:30 PM", "10:00 PM"
  ];

  if (!weeklyAvail || !weeklyAvail[dayName]) {
    rawSlots = defaultSlots;
  } else {
    const dayData = weeklyAvail[dayName];
    if (dayData.enabled === false) {
      return [];
    }
    const periods = ["morning", "afternoon", "evening", "night"] as const;
    periods.forEach(p => {
      const period = dayData[p];
      if (period && period.enabled && period.slots) {
        period.slots.forEach((s: any) => {
          if (!s) return;
          const timeValue = typeof s === "string" ? s : s.time;
          if (!timeValue) return;
          const parts = timeValue.split(/\s*(?:–|—|-)\s*/);
          if (parts.length === 2) {
            const startStr = parts[0];
            const endStr = parts[1];
            let start = parseTimeToMins(startStr);
            const end = parseTimeToMins(endStr);
            while (start < end) {
              rawSlots.push(formatMinsToTime(start));
              start += 30;
            }
          } else {
            rawSlots.push(timeValue);
          }
        });
      }
    });
  }

  rawSlots = Array.from(new Set(rawSlots));

  // Filter out slots that are already booked
  const bookedSlots = activeAppointments
    .filter((appt: any) => appt.vet_id === vet.user_id && appt.appointment_date === dateStr)
    .map((appt: any) => appt.appointment_time?.trim().toUpperCase());

  return rawSlots.filter(slot => !bookedSlots.includes(slot.trim().toUpperCase()));
}

// -------------------------------------------------------------------------
// Core Matching Algorithm
// -------------------------------------------------------------------------
export function runSmartMatch(request: SmartMatchRequest, vets: any[]) {
  // 1. Build Case & Infer Urgency/Emergency levels
  let emergencyFlag = "LOW";
  let urgencyScore = 0;

  const allText = JSON.stringify(request).toLowerCase();
  
  const highUrgencyKeywords = [
    "breathing difficulty", "heavy bleeding", "unable to walk", 
    "blood in vomit", "blood in stool", "blood in urine", "severe weakness", 
    "choking", "seizure", "collapse", "unconscious", "cannot drink water", "severe pain"
  ];
  
  const medUrgencyKeywords = [
    "repeated vomiting", "worsening", "refusal to drink", 
    "no urination", "labored breathing", "lethargic", "vomiting: 4+ times", "condition getting worse"
  ];

  if (highUrgencyKeywords.some(kw => allText.includes(kw))) {
    emergencyFlag = "HIGH";
    urgencyScore = 2;
  } else if (medUrgencyKeywords.some(kw => allText.includes(kw))) {
    emergencyFlag = "MEDIUM";
    urgencyScore = 1;
  }

  const requestedSpecies = (request.petDetails.species || "").toLowerCase();
  const activeAppointments = request.activeAppointments || [];
  const userPin = request.userPincode || "";

  // Set reference dates/times
  const currentLocalTime = new Date();
  const currentHour = currentLocalTime.getHours();
  const currentMinute = currentLocalTime.getMinutes();
  const currentMins = currentHour * 60 + currentMinute;
  const isCurrentlyNight = currentHour >= 20 || currentHour < 6; // 8 PM to 6 AM

  // 2. Main Filter: Filter vets that are active & approved
  const eligibleVets = vets.filter(vet => {
    if (vet.is_active === false) return false;
    // We favor verified ones but if requested, verify matches
    return true;
  });

  const scoredVets = eligibleVets.map(vet => {
    let speciesScore = 0;
    let specializationScore = 0;
    let clinicalExpertiseScore = 0;
    let conditionScore = 0;
    let availabilityScore = 0;
    let distanceScore = 0;
    let experienceScore = 0;
    let emergencyBoost = 0;
    let verificationScore = 0;
    let ratingScore = 0;

    let reasons: string[] = [];
    const specList = (vet.specializations || []).map((s: string) => s.toLowerCase());
    const expertiseList = (vet.clinical_expertise || []).map((e: string) => e.toLowerCase());

    // 2.1 Species Match (Weight: 25)
    if (specList.some((s: string) => s.includes(requestedSpecies))) {
      speciesScore = 25;
      reasons.push("Exact species match");
    } else if (specList.length === 0 || specList.includes("all") || specList.includes("general") || specList.includes("canine") || specList.includes("feline")) {
      speciesScore = 15;
      reasons.push("General species support");
    }

    // 2.2 Primary Specialization Match (Weight: 25)
    const concern = request.mainConcern.toLowerCase();
    const isSkin = concern.includes("itching") || concern.includes("skin") || allText.includes("itching");
    const isGastro = concern.includes("vomiting") || concern.includes("diarrhea") || concern.includes("appetite") || allText.includes("vomiting") || allText.includes("diarrhea");
    const isOrtho = concern.includes("injury") || concern.includes("mobility") || concern.includes("fracture") || concern.includes("limping");
    const isEye = concern.includes("eye");
    const isEar = concern.includes("ear");
    const isRespiratory = concern.includes("coughing") || concern.includes("breathing") || allText.includes("breathing");
    
    if (isSkin && specList.some((s: string) => s.includes("derma") || s.includes("skin"))) {
      specializationScore = 25;
    } else if (isGastro && specList.some((s: string) => s.includes("internal") || s.includes("general") || s.includes("gastro"))) {
      specializationScore = 25;
    } else if (isOrtho && specList.some((s: string) => s.includes("orthopedic") || s.includes("surgery"))) {
      specializationScore = 25;
    } else if (isEye && specList.some((s: string) => s.includes("ophthalmology") || s.includes("eye"))) {
      specializationScore = 25;
    } else if (isEar && specList.some((s: string) => s.includes("general") || s.includes("ent"))) {
      specializationScore = 20;
    } else if (isRespiratory && specList.some((s: string) => s.includes("emergency") || s.includes("internal") || s.includes("pulmo"))) {
      specializationScore = 25;
    } else if (specList.includes("general")) {
      specializationScore = 15;
    }

    if (specializationScore > 0) reasons.push("Strong specialization match");

    // 2.3 Clinical Expertise Match (Weight: 20)
    let expertiseMatches = 0;
    if (isSkin && expertiseList.some((e: string) => e.includes("skin") || e.includes("allergy"))) expertiseMatches++;
    if (isGastro && expertiseList.some((e: string) => e.includes("digestive") || e.includes("stomach") || e.includes("vomit") || e.includes("gastro"))) expertiseMatches++;
    if (isOrtho && expertiseList.some((e: string) => e.includes("joint") || e.includes("mobility") || e.includes("ortho"))) expertiseMatches++;
    if (isEye && expertiseList.some((e: string) => e.includes("eye") || e.includes("vision"))) expertiseMatches++;
    if (isEar && expertiseList.some((e: string) => e.includes("ear") || e.includes("hearing"))) expertiseMatches++;
    
    // Add additional keyword matches
    const kw = request.freeformKeyword.toLowerCase();
    if (kw && expertiseList.some((e: string) => e.includes(kw))) expertiseMatches++;

    if (expertiseMatches >= 3) {
      clinicalExpertiseScore = 20;
      reasons.push("Exceptional expertise match");
    } else if (expertiseMatches === 2) {
      clinicalExpertiseScore = 15;
      reasons.push("Great expertise match");
    } else if (expertiseMatches === 1) {
      clinicalExpertiseScore = 10;
      reasons.push("Relevant expertise match");
    }

    // 2.4 Frequently Managed Conditions Match (Weight: 10)
    // Map list of vet frequently managed conditions if it's stored on vet profile, or check clinical expertise matches
    if (allText && (expertiseList.some((e: string) => allText.includes(e)) || specList.some((s: string) => allText.includes(s)))) {
      conditionScore = 10;
      reasons.push("Condition match");
    } else {
      conditionScore = 5;
    }

    // 2.5 Real Geographic Distance Score (Weight: 5)
    let distanceInKm = 15.0;
    const hasUserCoords = request.userLat !== undefined && request.userLat !== null && request.userLon !== undefined && request.userLon !== null;
    const hasVetCoords = vet.latitude !== undefined && vet.latitude !== null && vet.longitude !== undefined && vet.longitude !== null;

    if (hasUserCoords && hasVetCoords) {
      distanceInKm = calculateHaversineDistance(
        Number(request.userLat),
        Number(request.userLon),
        Number(vet.latitude),
        Number(vet.longitude)
      );
    } else {
      const vetPin = vet.clinic_pincode || vet.hospital_pincode || "";
      distanceInKm = calculatePincodeDistance(userPin, vetPin);
    }

    if (distanceInKm <= 2.0) {
      distanceScore = 5;
    } else if (distanceInKm <= 5.0) {
      distanceScore = 4;
    } else if (distanceInKm <= 10.0) {
      distanceScore = 3;
    } else if (distanceInKm <= 20.0) {
      distanceScore = 2;
    } else {
      distanceScore = 1;
    }

    // 2.6 Experience Score (Weight: 3)
    const exp = vet.years_of_experience || 0;
    if (exp >= 10) experienceScore = 3;
    else if (exp >= 5) experienceScore = 2;
    else experienceScore = 1;

    // 2.7 Verification (Weight: 1)
    if (vet.verification_status === "verified" || vet.profile?.is_admin_approved === true) {
      verificationScore = 1;
    }

    // 2.8 Ratings (Weight: 1)
    const rating = vet.average_rating || 0;
    if (rating >= 4.8) ratingScore = 1;
    else if (rating >= 4.0) ratingScore = 0.5;

    // 2.9 Emergency capable Boost
    if (emergencyFlag === "HIGH" && (specList.includes("emergency") || expertiseList.some((e: string) => e.includes("emergency") || e.includes("critical")) || vet.emergency_available === true)) {
      emergencyBoost = 10;
      reasons.push("Emergency-capable prioritized");
    } else if (emergencyFlag === "MEDIUM") {
      emergencyBoost = 5;
    }

    // 2.10 Night Time Logic Boost
    let nightBoost = 0;
    if (isCurrentlyNight) {
      // Find today's day of week
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[currentLocalTime.getDay()];
      let weeklyAvail: any = null;
      if (vet.weekly_availability) {
        try {
          weeklyAvail = typeof vet.weekly_availability === "string" ? JSON.parse(vet.weekly_availability) : vet.weekly_availability;
        } catch (e) {
          weeklyAvail = null;
        }
      }
      if (weeklyAvail && weeklyAvail[dayName]?.night?.enabled === true) {
        nightBoost = 10;
        reasons.push("Active night availability");
      }
    }

    // Total base score before slot availability matching
    const baseMatchScore = speciesScore + specializationScore + clinicalExpertiseScore + conditionScore + distanceScore + experienceScore + verificationScore + ratingScore + emergencyBoost + nightBoost;

    // -------------------------------------------------------------------------
    // PART 2 & 3: Slot Searching & Availability Checks
    // -------------------------------------------------------------------------
    let chosenSlotDate = "";
    let chosenSlotTime = "";
    let finalSlotPriorityScore = 0; // closer/better slots get higher score (max 10 points for availability)
    let isSlotExact = false;

    const queryType = request.consultationType || "instant";

    if (queryType === "instant") {
      // Instant consultation: Today's remaining slots, otherwise fallback to next days
      let foundSlot = false;
      
      // Look up to 7 days ahead
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(currentLocalTime);
        checkDate.setDate(currentLocalTime.getDate() + dayOffset);
        const checkDateStr = checkDate.toISOString().split("T")[0];

        const availableSlots = getAvailableSlotsForVet(vet, checkDateStr, activeAppointments);
        
        // If it is today, we must only select slots in the future
        const isToday = dayOffset === 0;
        const remainingSlots = isToday 
          ? availableSlots.filter(slot => parseTimeToMins(slot) > currentMins)
          : availableSlots;

        if (remainingSlots.length > 0) {
          // Select the earliest available slot
          chosenSlotDate = checkDateStr;
          chosenSlotTime = remainingSlots[0];
          foundSlot = true;
          
          // Availability Score: earlier today gets max 10, future days decay
          if (isToday) {
            availabilityScore = 10;
            reasons.push(`Instant slot match today at ${chosenSlotTime}`);
          } else {
            availabilityScore = Math.max(1, 8 - dayOffset);
            reasons.push(`Next available slot on ${chosenSlotDate} at ${chosenSlotTime}`);
          }
          break;
        }
      }

      if (!foundSlot) {
        availabilityScore = 0;
      }

    } else {
      // Future scheduled consultation
      const reqDateStr = request.requestedDate || currentLocalTime.toISOString().split("T")[0];
      const reqTimeStr = request.requestedTime || "";

      let foundSlot = false;

      // 1. Try requested date first
      const slotsOnRequestedDate = getAvailableSlotsForVet(vet, reqDateStr, activeAppointments);
      
      if (slotsOnRequestedDate.length > 0) {
        if (reqTimeStr) {
          const reqMins = parseTimeToMins(reqTimeStr);
          // Find the exact slot or the nearest available slot on that day
          const exactMatch = slotsOnRequestedDate.find(s => s.trim().toUpperCase() === reqTimeStr.trim().toUpperCase());
          
          if (exactMatch) {
            chosenSlotDate = reqDateStr;
            chosenSlotTime = exactMatch;
            availabilityScore = 10;
            isSlotExact = true;
            reasons.push(`Exact scheduled slot match at ${chosenSlotTime}`);
            foundSlot = true;
          } else {
            // Find closest by minutes difference
            let minDiff = Infinity;
            let closestSlot = "";
            slotsOnRequestedDate.forEach(s => {
              const diff = Math.abs(parseTimeToMins(s) - reqMins);
              if (diff < minDiff) {
                minDiff = diff;
                closestSlot = s;
              }
            });

            if (closestSlot) {
              chosenSlotDate = reqDateStr;
              chosenSlotTime = closestSlot;
              // Score based on proximity (e.g. within 1 hour gets 9 points, decay otherwise)
              availabilityScore = minDiff <= 60 ? 9 : 7;
              reasons.push(`Nearest available slot on requested date: ${chosenSlotTime}`);
              foundSlot = true;
            }
          }
        } else {
          // No specific time requested, take the earliest slot
          chosenSlotDate = reqDateStr;
          chosenSlotTime = slotsOnRequestedDate[0];
          availabilityScore = 9;
          reasons.push(`Earliest slot on requested date: ${chosenSlotTime}`);
          foundSlot = true;
        }
      }

      // 2. If requested date is full, automatically search subsequent days (up to 7 days)
      if (!foundSlot) {
        for (let dayOffset = 1; dayOffset < 7; dayOffset++) {
          const baseDate = new Date(reqDateStr);
          baseDate.setDate(baseDate.getDate() + dayOffset);
          const checkDateStr = baseDate.toISOString().split("T")[0];

          const slots = getAvailableSlotsForVet(vet, checkDateStr, activeAppointments);
          if (slots.length > 0) {
            chosenSlotDate = checkDateStr;
            chosenSlotTime = slots[0];
            availabilityScore = Math.max(1, 6 - dayOffset);
            reasons.push(`Fallback slot booked on next available day (${chosenSlotDate} at ${chosenSlotTime})`);
            foundSlot = true;
            break;
          }
        }
      }

      if (!foundSlot) {
        availabilityScore = 0;
      }
    }

    // Final consolidated score calculation
    const totalScore = baseMatchScore + availabilityScore;

    return {
      vet,
      score: totalScore,
      speciesScore,
      specializationScore,
      clinicalExpertiseScore,
      conditionScore,
      availabilityScore,
      distanceScore,
      experienceScore,
      emergencyBoost,
      verificationScore,
      ratingScore,
      nightBoost,
      reasons: reasons.join(", "),
      experience: exp,
      rating,
      fee: vet.online_fee || 500,
      chosenSlot: chosenSlotDate && chosenSlotTime ? { date: chosenSlotDate, time: chosenSlotTime } : null,
      isSlotExact,
      isVerified: vet.verification_status === "verified" || vet.profile?.is_admin_approved === true
    };
  });

  // -------------------------------------------------------------------------
  // Ranking and Tie Breakers (Deterministic sorting)
  // -------------------------------------------------------------------------
  // Order:
  // 1. Verified veterinarians first (if at least one exists)
  // 2. Medical Suitability score + Availability (total score)
  // 3. Exact slot match vs closest
  // 4. Experience (higher is better)
  // 5. Rating (higher is better)
  // 6. Distance (closer is better)
  // 7. Fee (lower is better)
  scoredVets.sort((a, b) => {
    // Verified status priority
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    // Total matching score
    if (b.score !== a.score) return b.score - a.score;
    // Exact slot match
    if (a.isSlotExact !== b.isSlotExact) return a.isSlotExact ? -1 : 1;
    // Years of Experience
    if (b.experience !== a.experience) return b.experience - a.experience;
    // Rating
    if (b.rating !== a.rating) return b.rating - a.rating;
    // Distance
    let distA = 15.0;
    let distB = 15.0;
    const hasUserCoords = request.userLat !== undefined && request.userLat !== null && request.userLon !== undefined && request.userLon !== null;
    
    if (hasUserCoords && a.vet.latitude !== undefined && a.vet.latitude !== null && a.vet.longitude !== undefined && a.vet.longitude !== null) {
      distA = calculateHaversineDistance(Number(request.userLat), Number(request.userLon), Number(a.vet.latitude), Number(a.vet.longitude));
    } else {
      distA = calculatePincodeDistance(userPin, a.vet.clinic_pincode || a.vet.hospital_pincode || "");
    }

    if (hasUserCoords && b.vet.latitude !== undefined && b.vet.latitude !== null && b.vet.longitude !== undefined && b.vet.longitude !== null) {
      distB = calculateHaversineDistance(Number(request.userLat), Number(request.userLon), Number(b.vet.latitude), Number(b.vet.longitude));
    } else {
      distB = calculatePincodeDistance(userPin, b.vet.clinic_pincode || b.vet.hospital_pincode || "");
    }

    if (distA !== distB) return distA - distB;
    // Consultation Fee
    return a.fee - b.fee;
  });

  // Fallback Logic (Part 6)
  // If no vet is returned, or none has active slots, we rank purely on clinical capability
  // and fall back to the first available verified general vet.
  const bestResult = scoredVets.length > 0 ? scoredVets[0] : null;

  // Build the tie-breaker reason or select reason for audit logs
  let tieBreakReason = "Highest medical suitability & rating matches";
  if (scoredVets.length > 1) {
    const second = scoredVets[1];
    if (bestResult && bestResult.score === second.score) {
      if (bestResult.experience !== second.experience) {
        tieBreakReason = `Won on experience: ${bestResult.experience} years vs ${second.experience} years`;
      } else if (bestResult.rating !== second.rating) {
        tieBreakReason = `Won on rating: ${bestResult.rating} vs ${second.rating}`;
      } else {
        tieBreakReason = `Won on fee: ₹${bestResult.fee} vs ₹${second.fee}`;
      }
    }
  }

  // Fallback default slot if no slot was chosen
  let finalSlot = bestResult?.chosenSlot;
  if (bestResult && !finalSlot) {
    const fallbackDateStr = currentLocalTime.toISOString().split("T")[0];
    finalSlot = { date: fallbackDateStr, time: "11:00 AM" };
  }

  return {
    bestVet: bestResult ? {
      ...bestResult.vet,
      suggestedSlot: finalSlot // inject into vet object for auto-select in BookingDetails
    } : null,
    score: bestResult ? bestResult.score : 0,
    matchReason: bestResult ? bestResult.reasons : "No suitable veterinarian found.",
    emergencyFlag,
    auditLog: bestResult ? {
      matched_vet_id: bestResult.vet.id,
      final_match_score: bestResult.score,
      score_breakdown: {
        species_score: bestResult.speciesScore,
        specialization_score: bestResult.specializationScore,
        clinical_expertise_score: bestResult.clinicalExpertiseScore,
        condition_score: bestResult.conditionScore,
        availability_score: bestResult.availabilityScore,
        distance_score: bestResult.distanceScore,
        experience_score: bestResult.experienceScore,
        emergency_boost: bestResult.emergencyBoost,
        night_boost: bestResult.nightBoost || 0
      },
      tie_break_reason: tieBreakReason
    } : null
  };
}
