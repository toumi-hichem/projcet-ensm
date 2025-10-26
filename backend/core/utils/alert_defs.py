from core.models import Alert, PostalOffice
import logging

logger = logging.getLogger(__name__)

ALERT_DEFINITIONS = {
    "ALR001": {
        "title": "Envois non réceptionnés après transmission",
        "trigger_condition": "Envois transmis par un établissement (CDD/CTR/BP) vers un autre établissement et non scannés dans un délai de 3 jours.",
        "severity": "Urgence",
        "action_required": "Intervention immédiate auprès de l’établissement récepteur pour vérification et validation de la réception des envois.",
    },
    "ALR002": {
        "title": "Envois en attente de distribution",
        "trigger_condition": "Envois réceptionnés au niveau d’un établissement (BP ou CDD), sans événement de remise à l’agent de distribution ni échec de distribution dans un délai de 24h.",
        "severity": "Urgence",
        "action_required": "Rappel immédiat de l’établissement concerné pour initier le processus de distribution ou justifier le retard.",
    },
    "ALR003": {
        "title": "Dépassement du délai de garde",
        "trigger_condition": "Envois destinés à la distribution, présents au sein d’un établissement (BP ou CDD) depuis plus de 15 jours sans distribution ni réexpédition.",
        "severity": "Urgence",
        "action_required": "Vérification du statut des envois et déclenchement des mesures nécessaires (enregistrement de la distribution, réexpédition).",
    },
    "ALR004": {
        "title": "Dépêche en attente de traitement – Centre Aéropostal HB",
        "trigger_condition": "Dépêche postale réceptionnée par le Centre Aéropostal HB sans événement d’expédition vers le bureau suivant après 1 jour.",
        "severity": "Urgence",
        "action_required": "Interpellation immédiate du centre pour assurer le traitement de la dépêche.",
    },
    "ALR005": {
        "title": "Dépêche non réceptionnée – Alger CPX",
        "trigger_condition": "Dépêche expédiée par le Centre Aéropostal HB vers Alger CPX, non réceptionnée après 2 jours.",
        "severity": "Urgence",
        "action_required": "Vérification croisée entre les deux centres et enregistrement immédiat de la dépêche.",
    },
    "ALR006": {
        "title": "Envois non réceptionnés – CTNI",
        "trigger_condition": "Envois expédiés par Alger CPX vers le CTNI non réceptionnés après 2 jours.",
        "severity": "Urgence",
        "action_required": "Relance immédiate du CTNI et du centre émetteur pour localisation et régularisation.",
    },
    "ALR007": {
        "title": "Incident d’exploitation – Absence d’événements",
        "trigger_condition": "Aucune activité détectée pendant plus de 3 heures au niveau du CPX Alger ou du CTNI pendant les heures de fonctionnement.",
        "severity": "Urgence",
        "action_required": "Contact immédiat avec le centre concerné pour diagnostiquer un éventuel dysfonctionnement technique ou organisationnel.",
    },
    "ALR008": {
        "title": "Délais de concentration excessifs",
        "trigger_condition": "Envois réceptionnés dans un centre et non expédiés vers le prochain bureau dans un délai de 4 jours.",
        "severity": "Urgence",
        "action_required": "Enquête rapide sur les causes du retard et relance des opérations de traitement et d’acheminement.",
    },
}


def create_alert(alarm_code, office=None, state=None, event_timestamp=None):
    """Create an Alert linked to PostalOffice or State."""
    logger.debug(
        f"Creating alert: {alarm_code}, [{office}||{state}], {event_timestamp}"
    )
    alert_def = ALERT_DEFINITIONS.get(alarm_code)
    if not alert_def:
        logger.warning(f"Unknown alarm code: {alarm_code}")
        return None

    exists = Alert.objects.filter(
        alarm_code=alarm_code,
        timestamp=event_timestamp,
        office=office,
        state=state,
    ).exists()
    if exists:
        return None

    alert = Alert.objects.create(
        alarm_code=alarm_code,
        title=alert_def["title"],
        trigger_condition=alert_def["trigger_condition"],
        severity=alert_def["severity"],
        action_required=alert_def["action_required"],
        office=office,
        state=state,
        timestamp=event_timestamp,
    )
    logger.info(
        f"✅ Created alert {alert.alarm_code} for {office.name if office else state.name if state else 'unknown'}"
    )
    return alert
