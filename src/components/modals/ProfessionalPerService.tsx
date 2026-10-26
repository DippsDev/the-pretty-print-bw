import React, { useState } from "react";
import ProfessionalSelectionModal from "./ProfessionalSelection";
import { motion, AnimatePresence } from "framer-motion";
import { STYLISTS } from "@/lib/stylists";

const professionals = STYLISTS;

export default function ProfessionalPerServiceModal({
	open,
	onClose,
	bookings,
	selectedProfessionals,
	setSelectedProfessionals,
}: {
	open: boolean;
	onClose: () => void;
	bookings: { name: string; option: string; time: string; price: string }[];
	selectedProfessionals: { [bookingIdx: number]: number | undefined };
	setSelectedProfessionals: (bookingIdx: number, id: number | undefined) => void;
}) {
	const [modalOpenIdx, setModalOpenIdx] = useState<number | null>(null);

	if (!open) return null;

	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-[202] flex items-center justify-center" style={{ minHeight: "100dvh" }}>
					{/* Overlay with only fade/blur, no scale */}
					<motion.div
						key="professional-per-service-modal-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.22, ease: "linear" }}
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						style={{ zIndex: 0 }}
						onClick={onClose}
						aria-hidden="true"
					/>
					<motion.div
						key="professional-per-service-modal-content"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.25 }}
						className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 sm:p-8 flex flex-col"
						style={{ minHeight: 400, zIndex: 1 }}
						onClick={e => e.stopPropagation()}
					>
						<h2 className="text-2xl font-bold mb-8 text-[#141414]">Assign professionals per service</h2>
						<div className="flex flex-col gap-4">
							{bookings.map((b, i) => (
								<div key={i} className="border rounded-lg p-4 bg-white flex flex-row items-center gap-4">
									<div className="flex flex-col min-w-0 flex-1">
										<span className="font-semibold text-lg text-[#141414] truncate">
											{/* Show "name - option" if name contains option, else just option */}
											{b.name && b.option && !b.name.includes(b.option)
												? `${b.name} - ${b.option}`
												: b.name}
										</span>
										<span className="text-xs text-[#232323]/70">{b.time}</span>
									</div>
									<div className="flex flex-col items-end gap-2">
										<button
											className={`relative flex items-center justify-between px-8 py-2 rounded-full font-medium transition-colors min-w-[140px] bg-white text-[#141414] hover:border-[#33383C]`}
											style={{
												fontFamily: "inherit",
												boxShadow: "none",
												border: "1px solid #d1d5db",
											}}
											type="button"
											onClick={() => setModalOpenIdx(i)}
										>
											<span className="flex items-center mr-2">
												<svg width="20" height="20" fill="none" viewBox="0 0 32 32">
													<circle cx="12" cy="15" r="3" fill="#A3A3A3" />
													<circle cx="20" cy="15" r="3" fill="#A3A3A3" />
													<ellipse cx="16" cy="22" rx="7" ry="3" fill="#A3A3A3" />
												</svg>
											</span>
											<span className="flex-1 text-center">
												{selectedProfessionals[i] !== undefined
													? professionals.find(p => p.id === selectedProfessionals[i])?.name || "Any professional"
													: "Any professional"}
											</span>
											<span className="flex items-center ml-2">
												<svg width="18" height="18" fill="none" viewBox="0 0 20 20">
													<path d="M5 8l5 5 5-5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
												</svg>
											</span>
										</button>
									</div>
									<AnimatePresence>
										{modalOpenIdx === i && (
											<motion.div
												initial={{ opacity: 0, scale: 0.98 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.98 }}
												transition={{ duration: 0.25 }}
												style={{ position: 'fixed', inset: 0, zIndex: 111 }}
											>
												<ProfessionalSelectionModal
													open={modalOpenIdx === i}
													onClose={() => setModalOpenIdx(null)}
													selectedProfessional={selectedProfessionals[i]}
													onSelect={id => {
														// Toggle selection: deselect if already selected
														if (selectedProfessionals[i] === id) {
															setSelectedProfessionals(i, undefined);
														} else {
															setSelectedProfessionals(i, id);
														}
														setModalOpenIdx(null);
													}}
													professionals={professionals}
												/>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							))}
						</div>
						<div className="flex flex-row gap-4 mt-8">
							<button
								onClick={onClose}
								className="text-[#33383C] text-sm px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
								style={{ textDecoration: 'none' }}
							>
								Done
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
