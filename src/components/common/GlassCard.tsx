import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface GlassCardProps {
  className?: string
  children: ReactNode
  icon?: ReactNode
}

export const GlassCard = ({ className, icon, children }: GlassCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.34, ease: 'easeOut' }}
    className={cn('glass-panel', className)}
  >
    {icon ? <div className="mb-3 text-cyan-200/90">{icon}</div> : null}
    {children}
  </motion.div>
)
