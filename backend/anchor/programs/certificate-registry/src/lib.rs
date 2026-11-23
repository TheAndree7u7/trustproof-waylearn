use anchor_lang::prelude::*;

declare_id!("6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU");

/// TrustProof — Certificate Registry
///
/// Stores credential hashes on-chain. Each credential occupies a PDA
/// seeded by (issuer, credential_id), so it's globally unique and
/// verifiable by anyone without trusting any server.
#[program]
pub mod certificate_registry {
    use super::*;

    /// Register a new credential on-chain.
    /// Can only be called by the issuer who owns the PDA.
    pub fn register(
        ctx: Context<Register>,
        credential_id: [u8; 32],
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        let cert = &mut ctx.accounts.credential;
        cert.issuer        = ctx.accounts.issuer.key();
        cert.credential_id = credential_id;
        cert.evidence_hash = evidence_hash;
        cert.issued_at     = Clock::get()?.unix_timestamp;
        cert.revoked       = false;
        cert.bump          = ctx.bumps.credential;

        emit!(CredentialRegistered {
            issuer:        cert.issuer,
            credential_id: cert.credential_id,
            evidence_hash: cert.evidence_hash,
            issued_at:     cert.issued_at,
        });

        Ok(())
    }

    /// Update the evidence for an active credential.
    pub fn update(
        ctx: Context<Update>,
        credential_id: [u8; 32],
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        let credential = &mut ctx.accounts.credential;
        require!(!credential.revoked, CertError::AlreadyRevoked);
        credential.evidence_hash = evidence_hash;
        emit!(CredentialUpdated {
            issuer: credential.issuer,
            credential_id,
            evidence_hash,
        });
        Ok(())
    }

    /// Revoke a credential. Only the original issuer can revoke.
    pub fn revoke(
        ctx: Context<Revoke>,
        _credential_id: [u8; 32],
    ) -> Result<()> {
        let cert = &mut ctx.accounts.credential;
        require!(!cert.revoked, CertError::AlreadyRevoked);
        cert.revoked    = true;
        cert.revoked_at = Some(Clock::get()?.unix_timestamp);

        emit!(CredentialRevoked {
            issuer:        cert.issuer,
            credential_id: cert.credential_id,
            revoked_at:    cert.revoked_at.unwrap(),
        });

        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(credential_id: [u8; 32])]
pub struct Register<'info> {
    #[account(
        init,
        payer  = issuer,
        space  = Credential::LEN,
        seeds  = [b"credential", issuer.key().as_ref(), credential_id.as_ref()],
        bump,
    )]
    pub credential: Account<'info, Credential>,

    #[account(mut)]
    pub issuer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(credential_id: [u8; 32])]
pub struct Revoke<'info> {
    #[account(
        mut,
        seeds  = [b"credential", issuer.key().as_ref(), credential_id.as_ref()],
        bump   = credential.bump,
        has_one = issuer @ CertError::Unauthorized,
    )]
    pub credential: Account<'info, Credential>,

    pub issuer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(credential_id: [u8; 32])]
pub struct Update<'info> {
    #[account(
        mut,
        seeds = [b"credential", issuer.key().as_ref(), credential_id.as_ref()],
        bump = credential.bump,
        has_one = issuer @ CertError::Unauthorized,
    )]
    pub credential: Account<'info, Credential>,
    pub issuer: Signer<'info>,
}

// ── State ─────────────────────────────────────────────────────────────────────

#[account]
pub struct Credential {
    pub issuer:        Pubkey,       // 32
    pub credential_id: [u8; 32],    // 32
    pub evidence_hash: [u8; 32],    // 32
    pub issued_at:     i64,         // 8
    pub revoked:       bool,        // 1
    pub revoked_at:    Option<i64>, // 1 + 8
    pub bump:          u8,          // 1
}

impl Credential {
    // discriminator(8) + issuer(32) + cred_id(32) + ev_hash(32)
    // + issued_at(8) + revoked(1) + revoked_at(9) + bump(1)
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 9 + 1;
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct CredentialRegistered {
    pub issuer:        Pubkey,
    pub credential_id: [u8; 32],
    pub evidence_hash: [u8; 32],
    pub issued_at:     i64,
}

#[event]
pub struct CredentialUpdated {
    pub issuer: Pubkey,
    pub credential_id: [u8; 32],
    pub evidence_hash: [u8; 32],
}

#[event]
pub struct CredentialRevoked {
    pub issuer:        Pubkey,
    pub credential_id: [u8; 32],
    pub revoked_at:    i64,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum CertError {
    #[msg("Solo el emisor original puede revocar esta credencial")]
    Unauthorized,
    #[msg("La credencial ya fue revocada")]
    AlreadyRevoked,
}
