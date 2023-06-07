plugin_paths = { "/usr/share/jitsi-meet/prosody-plugins/" }

-- domain mapper options, must at least have domain base set to use the mapper
muc_mapper_domain_base = "jitsi1.pcall.app";

external_service_secret = "krHpmlpefup2MnN9";
external_services = {
     { type = "stun", host = "jitsi1.pcall.app", port = 3478 },
     { type = "turn", host = "jitsi1.pcall.app", port = 3478, transport = "udp", secret = true, ttl = 86400, algorithm = "turn" },
     { type = "turns", host = "jitsi1.pcall.app", port = 5349, transport = "tcp", secret = true, ttl = 86400, algorithm = "turn" }
};

cross_domain_bosh = false;
consider_bosh_secure = true;
-- https_ports = { }; -- Remove this line to prevent listening on port 5284

-- by default prosody 0.12 sends cors headers, if you want to disable it uncomment the following (the config is available on 0.12.1)
--http_cors_override = {
--    bosh = {
--        enabled = false;
--    };
--    websocket = {
--        enabled = false;
--    };
--}

-- https://ssl-config.mozilla.org/#server=haproxy&version=2.1&config=intermediate&openssl=1.1.0g&guideline=5.4
ssl = {
    protocol = "tlsv1_2+";
    ciphers = "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384"
}

unlimited_jids = {
    "focus@auth.jitsi1.pcall.app",
    "jvb@auth.jitsi1.pcall.app"
}

VirtualHost "jitsi1.pcall.app"
    authentication = "token" -- do not delete me
    -- Properties below are modified by jitsi-meet-tokens package config
    -- and authentication above is switched to "token"
    app_id="pcall-app"
    app_secret="Fidgety-Storable5-Stock-Species-Debug"
    -- Assign this host a certificate for TLS, otherwise it would use the one
    -- set in the global section (if any).
    -- Note that old-style SSL on port 5223 only supports one certificate, and will always
    -- use the global one.
    ssl = {
        key = "/etc/prosody/certs/jitsi1.pcall.app.key";
        certificate = "/etc/prosody/certs/jitsi1.pcall.app.crt";
    }
    av_moderation_component = "avmoderation.jitsi1.pcall.app"
    speakerstats_component = "speakerstats.jitsi1.pcall.app"
    conference_duration_component = "conferenceduration.jitsi1.pcall.app"
    end_conference_component = "endconference.jitsi1.pcall.app"
    -- we need bosh
    modules_enabled = {
        "bosh";
        "pubsub";
        "ping"; -- Enable mod_ping
        "speakerstats";
        "external_services";
        "conference_duration";
        "end_conference";
        "muc_lobby_rooms";
        "muc_breakout_rooms";
        "av_moderation";
        "room_metadata";
	"persistent_lobby";
    }
    c2s_require_encryption = false
    lobby_muc = "lobby.jitsi1.pcall.app"
    breakout_rooms_muc = "breakout.jitsi1.pcall.app"
    room_metadata_component = "metadata.jitsi1.pcall.app"
    main_muc = "conference.jitsi1.pcall.app"
    -- muc_lobby_whitelist = { "recorder.jitsi1.pcall.app" } -- Here we can whitelist jibri to enter lobby enabled rooms

Component "conference.jitsi1.pcall.app" "muc"
    restrict_room_creation = true
    storage = "memory"
    modules_enabled = {
        "muc_hide_all";
        "muc_meeting_id";
        "muc_domain_mapper";
        "polls";
        "token_verification";
        "muc_rate_limit";
        "muc_password_whitelist";
	"lobby_autostart";
	"token_affiliation";
        "token_lobby_bypass";

    }
    admins = { "focus@auth.jitsi1.pcall.app" }
    muc_password_whitelist = {
        "focus@auth.jitsi1.pcall.app"
    }
    muc_room_locking = false
    muc_room_default_public_jids = true
    party_check_timeout = 3600000


Component "breakout.jitsi1.pcall.app" "muc"
    restrict_room_creation = true
    storage = "memory"
    modules_enabled = {
        "muc_hide_all";
        "muc_meeting_id";
        "muc_domain_mapper";
        "muc_rate_limit";
        "polls";
    }
    admins = { "focus@auth.jitsi1.pcall.app" }
    muc_room_locking = false
    muc_room_default_public_jids = true

-- internal muc component
Component "internal.auth.jitsi1.pcall.app" "muc"
    storage = "memory"
    modules_enabled = {
        "muc_hide_all";
        "ping";
    }
    admins = { "focus@auth.jitsi1.pcall.app", "jvb@auth.jitsi1.pcall.app" }
    muc_room_locking = false
    muc_room_default_public_jids = true

VirtualHost "auth.jitsi1.pcall.app"
    ssl = {
        key = "/etc/prosody/certs/auth.jitsi1.pcall.app.key";
        certificate = "/etc/prosody/certs/auth.jitsi1.pcall.app.crt";
    }
    modules_enabled = {
        "limits_exception";
    }
    authentication = "internal_hashed"

-- Proxy to jicofo's user JID, so that it doesn't have to register as a component.
Component "focus.jitsi1.pcall.app" "client_proxy"
    target_address = "focus@auth.jitsi1.pcall.app"

Component "speakerstats.jitsi1.pcall.app" "speakerstats_component"
    muc_component = "conference.jitsi1.pcall.app"

Component "conferenceduration.jitsi1.pcall.app" "conference_duration_component"
    muc_component = "conference.jitsi1.pcall.app"

Component "endconference.jitsi1.pcall.app" "end_conference"
    muc_component = "conference.jitsi1.pcall.app"

Component "avmoderation.jitsi1.pcall.app" "av_moderation_component"
    muc_component = "conference.jitsi1.pcall.app"

Component "lobby.jitsi1.pcall.app" "muc"
    storage = "memory"
    restrict_room_creation = true
    muc_room_locking = false
    muc_room_default_public_jids = true
    modules_enabled = {
        "muc_hide_all";
        "muc_rate_limit";
        "polls";
    }

Component "metadata.jitsi1.pcall.app" "room_metadata_component"
    muc_component = "conference.jitsi1.pcall.app"
    breakout_rooms_component = "breakout.jitsi1.pcall.app"
