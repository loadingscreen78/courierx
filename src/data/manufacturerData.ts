// ──────────────────────────────────────────────────────────
// Curated database of major Indian pharmaceutical companies
// Used for autocomplete when category = "Branded"
// ──────────────────────────────────────────────────────────

export interface Manufacturer {
    name: string;
    address: string;
    aliases: string[];
}

export const MANUFACTURERS: Manufacturer[] = [
    // ── Top 10 by market cap ──
    {
        name: 'Sun Pharmaceutical Industries Ltd.',
        address: 'Sun House, Plot No. 201 B/1, Western Express Highway, Goregaon (E), Mumbai, Maharashtra 400063',
        aliases: ['Sun Pharma', 'Sun'],
    },
    {
        name: 'Cipla Ltd.',
        address: 'Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel, Mumbai, Maharashtra 400013',
        aliases: ['Cipla'],
    },
    {
        name: "Dr. Reddy's Laboratories Ltd.",
        address: '8-2-337, Road No. 3, Banjara Hills, Hyderabad, Telangana 500034',
        aliases: ["Dr Reddy's", 'Dr Reddys', 'DRL'],
    },
    {
        name: 'Lupin Ltd.',
        address: '3rd Floor, Kalpataru Inspire, Off Western Express Highway, Santacruz (E), Mumbai, Maharashtra 400055',
        aliases: ['Lupin'],
    },
    {
        name: 'Aurobindo Pharma Ltd.',
        address: 'Plot No. 2, Maitrivihar, Ameerpet, Hyderabad, Telangana 500038',
        aliases: ['Aurobindo'],
    },
    {
        name: 'Zydus Lifesciences Ltd.',
        address: 'Zydus Corporate Park, Scheme No. 63, Survey No. 536, Khoraj, Ahmedabad, Gujarat 382481',
        aliases: ['Zydus', 'Cadila Healthcare', 'Zydus Cadila'],
    },
    {
        name: 'Torrent Pharmaceuticals Ltd.',
        address: 'Torrent House, Off Ashram Road, Ahmedabad, Gujarat 380009',
        aliases: ['Torrent', 'Torrent Pharma'],
    },
    {
        name: 'Biocon Ltd.',
        address: '20th KM, Hosur Road, Electronic City, Bengaluru, Karnataka 560100',
        aliases: ['Biocon'],
    },
    {
        name: 'Glenmark Pharmaceuticals Ltd.',
        address: 'B/2, Mahalaxmi Chambers, 22, Bhulabhai Desai Road, Mumbai, Maharashtra 400026',
        aliases: ['Glenmark'],
    },
    {
        name: 'Alkem Laboratories Ltd.',
        address: 'Alkem House, Devashish Complex, Off Andheri Kurla Road, Andheri (E), Mumbai, Maharashtra 400059',
        aliases: ['Alkem'],
    },

    // ── Large-cap Indian pharma ──
    {
        name: 'Mankind Pharma Ltd.',
        address: '208, Okhla Industrial Estate, Phase-III, New Delhi 110020',
        aliases: ['Mankind'],
    },
    {
        name: 'Abbott India Ltd.',
        address: '3-4, Corporate Park, Sion-Trombay Road, Mumbai, Maharashtra 400071',
        aliases: ['Abbott'],
    },
    {
        name: 'Sanofi India Ltd.',
        address: 'Sanofi House, CTS No. 117-B, L&T Business Park, Saki Vihar Road, Powai, Mumbai, Maharashtra 400072',
        aliases: ['Sanofi'],
    },
    {
        name: 'Pfizer Ltd.',
        address: 'The Capital, Plot No. C-70, G Block, Bandra-Kurla Complex, Mumbai, Maharashtra 400051',
        aliases: ['Pfizer'],
    },
    {
        name: 'GlaxoSmithKline Pharmaceuticals Ltd.',
        address: 'GSK House, Dr. Annie Besant Road, Worli, Mumbai, Maharashtra 400030',
        aliases: ['GSK', 'GlaxoSmithKline'],
    },
    {
        name: 'AstraZeneca Pharma India Ltd.',
        address: 'Block N1, 12th Floor, Manyata Embassy Business Park, Rachenahalli, Bengaluru, Karnataka 560045',
        aliases: ['AstraZeneca', 'AZ'],
    },
    {
        name: 'Intas Pharmaceuticals Ltd.',
        address: 'Premier House, 1st Floor, Off C.G. Road, Navrangpura, Ahmedabad, Gujarat 380009',
        aliases: ['Intas'],
    },
    {
        name: 'IPCA Laboratories Ltd.',
        address: '48, Kandivli Industrial Estate, Kandivli (W), Mumbai, Maharashtra 400067',
        aliases: ['IPCA'],
    },
    {
        name: 'Natco Pharma Ltd.',
        address: 'Natco House, Road No. 2, Banjara Hills, Hyderabad, Telangana 500034',
        aliases: ['Natco'],
    },
    {
        name: 'Wockhardt Ltd.',
        address: 'Wockhardt Towers, Bandra-Kurla Complex, Bandra (E), Mumbai, Maharashtra 400051',
        aliases: ['Wockhardt'],
    },

    // ── Mid-cap & specialty pharma ──
    {
        name: 'Hetero Labs Ltd.',
        address: 'Hetero Corporate, 7-2-A2, Industrial Estates, Sanath Nagar, Hyderabad, Telangana 500018',
        aliases: ['Hetero'],
    },
    {
        name: 'Macleods Pharmaceuticals Ltd.',
        address: 'Macleods House, Worli, Mumbai, Maharashtra 400030',
        aliases: ['Macleods'],
    },
    {
        name: 'Micro Labs Ltd.',
        address: 'No. 27, Race Course Road, Bengaluru, Karnataka 560001',
        aliases: ['Micro Labs'],
    },
    {
        name: 'USV Pvt. Ltd.',
        address: 'BSD Marg, Station Road, Govandi, Mumbai, Maharashtra 400088',
        aliases: ['USV'],
    },
    {
        name: 'Emcure Pharmaceuticals Ltd.',
        address: 'Emcure House, T-184, MIDC, Bhosari, Pune, Maharashtra 411026',
        aliases: ['Emcure'],
    },
    {
        name: 'Ajanta Pharma Ltd.',
        address: 'Ajanta House, 98 Govt. Ind. Estate, Charkop, Kandivli (W), Mumbai, Maharashtra 400067',
        aliases: ['Ajanta'],
    },
    {
        name: 'Piramal Pharma Ltd.',
        address: 'Piramal Ananta, Agastya Corporate Park, Kamani Junction, LBS Road, Kurla (W), Mumbai, Maharashtra 400070',
        aliases: ['Piramal'],
    },
    {
        name: 'Eris Lifesciences Ltd.',
        address: '8th Floor, Commerce House-IV, Prahladnagar, Ahmedabad, Gujarat 380015',
        aliases: ['Eris'],
    },
    {
        name: 'Jubilant Pharmova Ltd.',
        address: 'Plot No. 1A, Sector 16A, Institutional Area, Noida, Uttar Pradesh 201301',
        aliases: ['Jubilant', 'Jubilant Pharmova'],
    },
    {
        name: 'Laurus Labs Ltd.',
        address: 'Plot No. 21, Jawaharlal Nehru Pharma City, Parawada, Visakhapatnam, Andhra Pradesh 531021',
        aliases: ['Laurus'],
    },
    {
        name: 'Granules India Ltd.',
        address: '2nd Floor, 3rd Block, My Home Hub, Madhapur, Hyderabad, Telangana 500081',
        aliases: ['Granules'],
    },
    {
        name: 'Strides Pharma Science Ltd.',
        address: 'Strides House, Bannerghatta Road, Arekere, Bengaluru, Karnataka 560076',
        aliases: ['Strides'],
    },
    {
        name: 'Suven Pharmaceuticals Ltd.',
        address: '8-2-334, SDE Serene Chambers, Road No. 5, Banjara Hills, Hyderabad, Telangana 500034',
        aliases: ['Suven'],
    },
    {
        name: 'FDC Ltd.',
        address: 'B-8, MIDC Industrial Estate, Waluj, Aurangabad, Maharashtra 431136',
        aliases: ['FDC'],
    },
    {
        name: 'J.B. Chemicals & Pharmaceuticals Ltd.',
        address: 'Neelam Centre, Hind Rajasthan Building, D.S. Phalke Road, Dadar, Mumbai, Maharashtra 400014',
        aliases: ['JB Chemicals', 'JB Pharma'],
    },
    {
        name: 'Indoco Remedies Ltd.',
        address: 'Indoco House, 166, CST Road, Santacruz (E), Mumbai, Maharashtra 400098',
        aliases: ['Indoco'],
    },
    {
        name: 'Alembic Pharmaceuticals Ltd.',
        address: 'Alembic Road, Vadodara, Gujarat 390003',
        aliases: ['Alembic'],
    },
    {
        name: 'Gland Pharma Ltd.',
        address: 'Plot No. 6/A, S.V. Co-operative Industrial Estate, Balanagar, Hyderabad, Telangana 500037',
        aliases: ['Gland'],
    },
    {
        name: 'Divi\'s Laboratories Ltd.',
        address: '7-1-77/E/1/303, Divi Towers, Dharam Karan Road, Ameerpet, Hyderabad, Telangana 500016',
        aliases: ['Divis', "Divi's"],
    },

    // ── Niche & specialty ──
    {
        name: 'Cadila Pharmaceuticals Ltd.',
        address: 'Cadila Corporate Cross Road, Sarkhej-Dholka Road, Bhat, Ahmedabad, Gujarat 382210',
        aliases: ['Cadila'],
    },
    {
        name: 'Gufic Biosciences Ltd.',
        address: 'Plot No. 10, GIDC Industrial Estate, Navsari, Gujarat 396445',
        aliases: ['Gufic'],
    },
    {
        name: 'Shalby Ltd.',
        address: 'Opp. Karnavati Club, S.G. Highway, Ahmedabad, Gujarat 380015',
        aliases: ['Shalby'],
    },
    {
        name: 'Bliss GVS Pharma Ltd.',
        address: '102, Hyde Park, Saki Vihar Road, Andheri (E), Mumbai, Maharashtra 400072',
        aliases: ['Bliss GVS'],
    },
    {
        name: 'Marksans Pharma Ltd.',
        address: '11th Floor, Grandeur, Thane-Belapur Road, Airoli, Navi Mumbai, Maharashtra 400708',
        aliases: ['Marksans'],
    },
    {
        name: 'Aarti Drugs Ltd.',
        address: 'Plot Nos. E-21/22, MIDC, Tarapur, Palghar, Maharashtra 401506',
        aliases: ['Aarti Drugs'],
    },
    {
        name: 'Shilpa Medicare Ltd.',
        address: 'Plot No. 15/1, Vishwakarma Ind. Area, Jeedimetla, Hyderabad, Telangana 500055',
        aliases: ['Shilpa Medicare'],
    },
    {
        name: 'RPG Life Sciences Ltd.',
        address: 'RPG House, 463, Dr. Annie Besant Road, Worli, Mumbai, Maharashtra 400030',
        aliases: ['RPG'],
    },
    {
        name: 'Lincoln Pharmaceuticals Ltd.',
        address: 'Trimul Estate, Khatraj-Kalol Highway, Khatraj, Gandhinagar, Gujarat 382721',
        aliases: ['Lincoln'],
    },
    {
        name: 'Aristo Pharmaceuticals Pvt. Ltd.',
        address: '23-A, Shah Industrial Estate, Off Veera Desai Road, Andheri (W), Mumbai, Maharashtra 400053',
        aliases: ['Aristo'],
    },
    {
        name: 'Franco-Indian Pharmaceuticals Pvt. Ltd.',
        address: '16/A, Pant Nagar, Ghatkopar (E), Mumbai, Maharashtra 400075',
        aliases: ['Franco-Indian'],
    },
    {
        name: 'Elder Pharmaceuticals Ltd.',
        address: 'D-21, MIDC, Andheri (E), Mumbai, Maharashtra 400093',
        aliases: ['Elder'],
    },
    {
        name: 'German Remedies (Zydus Healthcare)',
        address: 'Zydus Tower, Satellite Cross Roads, Ahmedabad, Gujarat 380015',
        aliases: ['German Remedies'],
    },
    {
        name: 'Wallace Pharmaceuticals Pvt. Ltd.',
        address: 'Wallace House, 16/2, Mahal Ind. Estate, Mahakali Caves Road, Andheri (E), Mumbai, Maharashtra 400093',
        aliases: ['Wallace'],
    },
];

/**
 * Search manufacturers by query (case-insensitive, checks name + aliases).
 * Returns up to `limit` matches sorted by relevance.
 */
export function searchManufacturers(query: string, limit = 8): Manufacturer[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    type Scored = { manufacturer: Manufacturer; score: number };
    const scored: Scored[] = [];

    for (const m of MANUFACTURERS) {
        const nameLower = m.name.toLowerCase();

        // Exact prefix on full name → highest priority
        if (nameLower.startsWith(q)) {
            scored.push({ manufacturer: m, score: 100 });
            continue;
        }

        // Check alias matches
        let aliasScore = 0;
        for (const alias of m.aliases) {
            const al = alias.toLowerCase();
            if (al === q) {
                aliasScore = 95;
                break;
            }
            if (al.startsWith(q)) {
                aliasScore = Math.max(aliasScore, 90);
            }
            if (al.includes(q)) {
                aliasScore = Math.max(aliasScore, 70);
            }
        }
        if (aliasScore > 0) {
            scored.push({ manufacturer: m, score: aliasScore });
            continue;
        }

        // Substring match on full name
        if (nameLower.includes(q)) {
            scored.push({ manufacturer: m, score: 50 });
            continue;
        }

        // Word-start match (e.g. "red" matches "Dr. Reddy's")
        const words = nameLower.split(/[\s.,'/()-]+/);
        if (words.some(w => w.startsWith(q))) {
            scored.push({ manufacturer: m, score: 40 });
        }
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.manufacturer);
}
