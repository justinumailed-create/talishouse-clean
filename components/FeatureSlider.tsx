import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const features = [
  "From $58.50 per sq. ft.",
  "Up in a day, finished in a week",
  "Retail and Wholesale Terms available",
  "Lease-To-Own, OAC."
]

export function FeatureSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full text-center">
      <div className="h-[28px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="text-base text-gray-600 font-medium"
          >
            {features[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}