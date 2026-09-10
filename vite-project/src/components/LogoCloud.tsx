import { InfiniteSlider } from '../../components/motion-primitives/infinite-slider'
import { ProgressiveBlur } from '../../components/motion-primitives/progressive-blur'

type Logo = {
    src: string
    alt: string
    label?: string
    href: string
    imgClass?: string
}

// Partner publishers and schools, each linking to their own official site.
const GAJ: Logo = { src: 'https://c242950.parspack.net/c242950/media/Gaj-logo.png', alt: 'انتشارات بین‌المللی گاج', label: 'انتشارات بین‌المللی گاج', href: 'https://www.gaj.ir/' }
const MEHROMAH: Logo = { src: 'https://c242950.parspack.net/c242950/media/mehromah.png', alt: 'انتشارات مهروماه', href: 'https://home.mehromah.ir/' }
const ALLAMEH: Logo = { src: 'https://c242950.parspack.net/c242950/media/allametbtb-2.png', alt: 'دبیرستان علامه طباطبایی', label: 'علامه طباطبایی', href: 'https://allamehtabatabaii.com/' }
const HADAF: Logo = { src: '/hadaf-yellow-tr.png', alt: 'کنکور هدف', label: 'کنکور هدف', href: 'https://hadaf.academy/', imgClass: 'h-8' }
const SALAM: Logo = { src: '/logo-salam.webp', alt: 'مجموعه مدارس سلام', label: 'مجموعه مدارس سلام', href: 'https://salam.school/' }
const BAHARESTAN: Logo = { src: '/baharestan.png', alt: 'دبیرستان بهارستان (کرج)', label: 'دبیرستان بهارستان (کرج)', href: 'http://www.baharestanac.ir/', imgClass: 'h-8' }
const ALPHA: Logo = { src: '/alpha-school.svg', alt: 'آلفا اسکول', label: 'آلفا اسکول', href: 'https://alphaschool.ir/', imgClass: 'h-8' }
const HANAN: Logo = { src: '/hanan.png', alt: 'مجموعه مدارس حنان', label: 'مجموعه مدارس حنان', href: 'http://hannanedu.ir/', imgClass: 'h-8' }
const SHAFIE: Logo = { src: '/shafie.png', alt: 'بنیاد علمی آموزشی شفیعی', label: 'بنیاد علمی آموزشی شفیعی', href: 'https://alirezashafei.com/fa', imgClass: 'h-8' }
const NESHANE_RASA: Logo = { src: '/neshane-rasa.png', alt: 'مجموعه مدارس نشانه رستا', label: 'مجموعه مدارس نشانه رستا', href: 'http://www.madrese.org/', imgClass: 'h-8' }
const ROSHANGARAN: Logo = { src: '/roshangaran.png', alt: 'دبیرستان روشنگران', label: 'دبیرستان روشنگران', href: 'https://roshangaran.org/', imgClass: 'h-8' }

const ROW_1: Logo[] = [GAJ, MEHROMAH, ALLAMEH, HADAF, GAJ, MEHROMAH, SALAM]
const ROW_2: Logo[] = [BAHARESTAN, ALPHA, HANAN, SHAFIE, NESHANE_RASA, ROSHANGARAN]

function LogoLink({ src, alt, label, href, imgClass = 'h-10' }: Logo) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
        >
            <img className={`mx-auto ${imgClass}`} src={src} alt={alt} width="auto" />
            {label ? <div className="self-center font-bold">{label}</div> : null}
        </a>
    )
}

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
                            {ROW_1.map((logo, index) => (
                                <LogoLink key={`${logo.href}-${index}`} {...logo} />
                            ))}
                        </InfiniteSlider>

                        <div className='mt-7'></div>

                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={100}
                        >
                            {ROW_2.map((logo, index) => (
                                <LogoLink key={`${logo.href}-${index}`} {...logo} />
                            ))}
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
