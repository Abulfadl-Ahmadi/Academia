import { InfiniteSlider } from '../../components/motion-primitives/infinite-slider'
import { ProgressiveBlur } from '../../components/motion-primitives/progressive-blur'

export default function LogoCloud() {
    return (
        <section className="container mx-auto  bg-background overflow-hidden py-16" dir='ltr'>
            <div className="group relative m-auto max-w-7xl px-6 ">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="relative py-6 w-full">
                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={100}
                            reverse>
                            {/* First set of logos */}
                            <div className="flex gap-1">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/Gaj-logo.png"
                                    alt="Nvidia Logo"
                                    // height="20"
                                    width="auto"
                                />
                                <div className='self-center font-bold'>
                                انتشارات بین‌المللی گاج
                                </div>
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/mehromah.png"
                                    alt="Column Logo"
                                    // height="16"
                                    width="auto"
                                />
                            </div>
                            <div className="flex gap-2">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/allametbtb-2.png"
                                    alt="Column Logo"
                                    // height="16"
                                    width="auto"
                                />
                                <div className='self-center font-bold'>
                                     علامه طباطبایی
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/Gaj-logo.png"
                                    alt="Nvidia Logo"
                                    // height="20"
                                    width="auto"
                                />
                                <div className='self-center font-bold'>
                                انتشارات بین‌المللی گاج
                                </div>
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/mehromah.png"
                                    alt="Column Logo"
                                    // height="16"
                                    width="auto"
                                />
                            </div>
                            <div className="flex gap-2">
                                <img
                                    className="mx-auto h-10 "
                                    src="https://c242950.parspack.net/c242950/media/allametbtb-2.png"
                                    alt="Column Logo"
                                    // height="16"
                                    width="auto"
                                />
                                <div className='self-center font-bold'>
                                     علامه طباطبایی
                                </div>
                            </div>
                            
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}